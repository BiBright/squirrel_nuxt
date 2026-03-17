<template>
  <div>
    <AppPageHeader title="Forms" subtitle="Manage your form templates" />

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

    <div v-if="loading" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading forms...</p>
      </div>
    </div>

    <template v-else-if="view === 'list'">
      <AppTable
        :columns="columns"
        :rows="tableRows"
        :button-delete="true"
        @delete="onDeleteRow"
        @select="onSelect"
      >
        <template #cell-name="{ value, row }">
          <NuxtLink :to="`/forms/${row._raw.id}`" class="app-table__cell-link">{{ value }}</NuxtLink>
          <span v-if="row.description" class="app-table__cell-sub">{{ row.description }}</span>
        </template>

        <template #cell-fields="{ value }">
          <span>{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <AppBadge :variant="value === 'Active' ? 'success' : 'danger'">{{ value }}</AppBadge>
        </template>

        <template #cell-template="{ value }">
          <AppBadge v-if="value" variant="neutral">
            <span class="material-icons-round" style="font-size:14px">attach_file</span>
            {{ value }}
          </AppBadge>
          <span v-else class="text-muted">—</span>
        </template>

        <template #empty>
          <span class="material-icons-round">description</span>
          <p>No forms found.</p>
        </template>
      </AppTable>
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div v-if="filtered.length === 0" class="list-container">
        <div class="list-empty">
          <span class="material-icons-round">description</span>
          <p>No forms found.</p>
        </div>
      </div>

      <div v-else class="list-mosaic">
        <div v-for="form in filtered" :key="form.id" class="list-card">
          <div class="list-card__header">
            <NuxtLink :to="`/forms/${form.id}`" class="list-card__title">{{ form.name }}</NuxtLink>
          </div>
          <div class="list-card__meta">
            <div v-if="form.description" class="list-card__meta-row">
              <span class="material-icons-round">notes</span>
              {{ form.description }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">format_list_bulleted</span>
              {{ form.fields_count }} field{{ form.fields_count !== 1 ? 's' : '' }}
            </div>
            <div v-if="form.has_template" class="list-card__meta-row">
              <span class="material-icons-round">attach_file</span>
              {{ form.template_file_name }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">calendar_today</span>
              {{ formatDate(form.created_at) }}
            </div>
          </div>
          <div class="list-card__footer">
            <AppBadge :variant="form.is_active ? 'success' : 'danger'">
              {{ form.is_active ? 'Active' : 'Inactive' }}
            </AppBadge>
          </div>
        </div>
      </div>
    </template>

    <AppPagination :page="page" :last-page="lastPage" :total="total" @go="goTo" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface Form {
  id: number
  name: string
  description: string | null
  has_template: boolean
  template_file_name: string | null
  is_active: boolean
  fields_count: number
  created_at: string
}

const columns = [
  { key: 'name',     label: 'Name',     primary: true },
  { key: 'fields',   label: 'Fields' },
  { key: 'status',   label: 'Status' },
  { key: 'template', label: 'Template' },
  { key: 'date',     label: 'Created' },
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

const forms = ref<Form[]>([])
const loading = ref(true)
const { search, sort, view, selectedCount, onSelect, onDelete } = useListToolbar()
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

function onDeleteRow(_row: Record<string, unknown>, _idx: number) { /* TODO */ }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
