<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Models' }, { label: 'Fields', to: '/fields' }]" />
        </div>

        <AppPageHeader title="Fields" />

        <div class="col-12">
          <AppListToolbar v-model:search="search" v-model:sort="sort" v-model:view="view" label="field"
            add-label="New Field" :total-count="filtered.length" :selected-count="selectedCount"
            @add="navigateTo('/fields/create')" @delete="onDelete" />
        </div>

        <div class="col-12">
          <div v-if="loading" class="list-container">
            <div class="list-empty">
              <span class="material-icons-round">hourglass_empty</span>
              <p>Loading fields...</p>
            </div>
          </div>

          <AppBlankState v-else-if="blankState.show.value" :image="blankState.image.value"
            :title="blankState.title.value" :message="blankState.message.value">
            <AppButton to="/fields/create">
              <span class="material-icons-round">add</span>
              New Field
            </AppButton>
          </AppBlankState>

          <template v-else-if="effectiveView === 'list'">
            <AppTable :columns="columns" button-edit :rows="tableRows" @select="onSelect"
              @edit="(row) => navigateTo(`/fields/${row._raw.id}`)">

              <template #cell-name="{ value, row }">
                <NuxtLink :to="`/fields/${row._raw.id}`" class="app-table__cell-link">{{ value }}</NuxtLink>
              </template>

              <template #cell-file="{ value, row }">
                <a v-if="value" :href="(row.fileUrl as string)" class="file-download-link" target="_blank" download>
                  <span class="material-icons-round">attach_file</span>
                  {{ value }}
                </a>
                <span v-else class="text-muted">—</span>
              </template>

              <template #cell-type="{ value }">
                <AppBadge variant="neutral">{{ value }}</AppBadge>
              </template>

              <template #cell-status="{ value }">
                <AppBadge :variant="value === 'Active' ? 'success' : 'danger'">{{ value }}</AppBadge>
              </template>
            </AppTable>
          </template>

          <template v-else>
            <div class="list-mosaic">
              <div v-for="field in filtered" :key="field.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="`/fields/${field.id}`" class="list-card__title">{{ field.name }}</NuxtLink>
                </div>
                <div class="list-card__meta">
                  <div v-if="field.description" class="list-card__meta-row">
                    {{ field.description }}
                  </div>
                </div>
                <div class="list-card__footer">
                  <AppBadge variant="neutral">{{ field.type_label }}</AppBadge>
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

interface Field {
  id: number
  name: string
  description: string | null
  type: string
  type_label: string
  is_active: boolean
  created_at: string
  template_file_name: string | null
  template_file_url: string | null
}

const columns = [
  { key: 'name', label: 'Field Name', primary: true },
  { key: 'description', label: 'Description' },
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
const fields = ref<Field[]>([])
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
    const res = await api<{ data: Field[] | PaginatedResponse<Field> }>(`/fields?page=${page.value}`)
    const d = res.data
    console.log(d);
    if (Array.isArray(d)) { fields.value = d }
    else { fields.value = d.data; setMeta(d.meta) }
  }
  catch { fields.value = [] }
  finally { loading.value = false }
}

onMounted(fetchData)
watch(page, fetchData)

const filtered = computed(() => {
  let result = [...fields.value]
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
  image: '/images/blankPages/fields.svg',
  title: 'No fields yet',
  message: 'Create reusable input fields for your forms.',
})

const tableRows = computed(() =>
  filtered.value.map(f => ({
    name: f.name,
    description: f.description,
    file: f.template_file_name,
    fileUrl: f.template_file_url,
    type: f.type_label,
    status: f.is_active ? 'Active' : 'Inactive',
    date: formatDate(f.created_at),
    _raw: f,
  })),
)

async function onDeleteRow(row: Record<string, unknown>, _idx: number) {
  const field = row._raw as Field
  try {
    const api = useApi()
    await api(`/fields/${field.id}`, { method: 'DELETE' })
    fields.value = fields.value.filter(f => f.id !== field.id)
    toast.success('Field deleted', { category: 'field' })
  }
  catch (err) {
    toast.error(err, 'Could not delete field', { category: 'field' })
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.file-download-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: var(--text-sm);
  text-decoration: none;

  .material-icons-round {
    font-size: 16px;
  }
}
</style>
