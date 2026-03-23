<template>
  <div>

    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Models' }, { label: 'Forms', to: '/forms' }]" />
        </div>

        <AppPageHeader title="Forms"/>

        <div class="col-12">
          <AppListToolbar
            v-model:search="search"
            v-model:sort="sort"
            v-model:view="view"
            label="form"
            add-label="New Form"
            :total-count="filtered.length"
            :selected-count="selectedCount"
            @add="navigateTo('/forms/create')"
            @delete="onDelete"
          />
        </div>

        <div class="col-12">
          <div v-if="loading" class="list-container">
            <div class="list-empty">
              <span class="material-icons-round">hourglass_empty</span>
              <p>Loading forms...</p>
            </div>
          </div>

          <AppBlankState
            v-else-if="blankState.show.value"
            :image="blankState.image.value"
            :title="blankState.title.value"
            :message="blankState.message.value"
          >
            <AppButton to="/forms/create">
              <span class="material-icons-round">add</span>
              New Form
            </AppButton>
          </AppBlankState>

          <template v-else-if="effectiveView === 'list'">
            <AppTable
              :columns="columns"
              :rows="tableRows"
              :button-delete="true"
              @select="onSelect"
            >
              <template #cell-name="{ value, row }">
                <NuxtLink :to="`/forms/${row._raw.id}`" class="app-table__cell-link">{{ value }}</NuxtLink>
                <span v-if="row.description" class="app-table__cell-sub">{{ row.description }}</span>
              </template>

              <template #cell-fields="{ value }">
                <span>{{ value }}</span>
              </template>

              <template #cell-template="{ value }">
                <AppBadge v-if="value" variant="neutral">
                  <span class="material-icons-round" style="font-size:14px">attach_file</span>
                  {{ value }}
                </AppBadge>
                <span v-else class="text-muted">—</span>
              </template>
            </AppTable>
          </template>

          <!-- MOSAIC VIEW -->
          <template v-else>
            <div class="list-mosaic">
              <div v-for="form in filtered" :key="form.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="`/forms/${form.id}`" class="list-card__title">{{ form.name }}</NuxtLink>
                </div>
                <div class="list-card__meta">
                  <div v-if="form.description" class="list-card__meta-row">
                    {{ form.description }}
                  </div>
                  
                  <div v-if="form.has_template" class="list-card__meta-row">
                    <span class="material-icons-round">attach_file</span>
                    {{ form.template_file_name }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="col-12">
          <AppPagination :page="page" :last-page="lastPage" :total="total" @go="goTo" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

interface Form {
  id: number
  name: string
  description: string | null
  template_file_name: string | null
}

const columns = [
  { key: 'name',     label: 'Name',     primary: true },
  { key: 'description',     label: 'Description' },
  { key: 'file', label: 'File' }
]

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

const toast = useAppToast()
const forms = ref<Form[]>([])
const loading = ref(true)
const { search, sort, view, selectedCount, onSelect, onDelete } = useListToolbar()
const isMobile = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', e => { isMobile.value = e.matches })
})
const effectiveView = computed(() => isMobile.value ? 'grid' : view.value)
const { page, lastPage, total, setMeta, goTo } = useListPagination()

async function fetchData() {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<{ data: Form[] | PaginatedResponse<Form> }>(`/forms?page=${page.value}`)
    const d = res.data
    if (Array.isArray(d)) { forms.value = d }
    else { forms.value = d.data; setMeta(d.meta) }
  }
  catch { forms.value = [] }
  finally { loading.value = false }
}

onMounted(fetchData)
watch(page, fetchData)

const filtered = computed(() => {
  let result = [...forms.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(f => f.name.toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const blankState = useBlankState(filtered, search, {
  image: '/images/blankPages/forms.svg',
  title: 'No forms yet',
  message: 'Build your first form to start collecting data.',
})

const tableRows = computed(() =>
  filtered.value.map(f => ({
    name: f.name,
    description: f.description,
    fields: `${f.fields_count} field${f.fields_count !== 1 ? 's' : ''}`,
    status: f.is_active ? 'Active' : 'Inactive',
    template: f.has_template ? f.template_file_name : null,
    date: formatDate(f.created_at),
    _raw: f,
  })),
)

async function onDeleteRow(row: Record<string, unknown>, _idx: number) {
  const form = row._raw as Form
  try {
    const api = useApi()
    await api(`/forms/${form.id}`, { method: 'DELETE' })
    forms.value = forms.value.filter(f => f.id !== form.id)
    toast.success('Form deleted', { category: 'form' })
  }
  catch (err) {
    toast.error(err, 'Could not delete form', { category: 'form' })
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
