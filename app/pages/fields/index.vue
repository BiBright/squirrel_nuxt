<template>
  <div>
    <AppPageHeader title="Fields" subtitle="Reusable input fields for your forms" />

    <AppListToolbar
      v-model:search="search"
      v-model:sort="sort"
      v-model:view="view"
      label="field"
      add-label="New Field"
      :total-count="filtered.length"
      :selected-count="selectedCount"
      @add="navigateTo('/fields/create')"
      @delete="onDelete"
    />

    <div v-if="loading" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading fields...</p>
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
          <NuxtLink :to="`/fields/${row._raw.id}`" class="app-table__cell-link">{{ value }}</NuxtLink>
          <span v-if="row.description" class="app-table__cell-sub">{{ row.description }}</span>
        </template>

        <template #cell-type="{ value }">
          <AppBadge variant="neutral">{{ value }}</AppBadge>
        </template>

        <template #cell-status="{ value }">
          <AppBadge :variant="value === 'Active' ? 'success' : 'danger'">{{ value }}</AppBadge>
        </template>

        <template #empty>
          <span class="material-icons-round">input</span>
          <p>No fields found.</p>
        </template>
      </AppTable>
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div v-if="filtered.length === 0" class="list-container">
        <div class="list-empty">
          <span class="material-icons-round">input</span>
          <p>No fields found.</p>
        </div>
      </div>

      <div v-else class="list-mosaic">
        <div v-for="field in filtered" :key="field.id" class="list-card">
          <div class="list-card__header">
            <NuxtLink :to="`/fields/${field.id}`" class="list-card__title">{{ field.name }}</NuxtLink>
          </div>
          <div class="list-card__meta">
            <div v-if="field.description" class="list-card__meta-row">
              <span class="material-icons-round">notes</span>
              {{ field.description }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">category</span>
              {{ field.type_label }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">calendar_today</span>
              {{ formatDate(field.created_at) }}
            </div>
          </div>
          <div class="list-card__footer">
            <AppBadge :variant="field.is_active ? 'success' : 'danger'">
              {{ field.is_active ? 'Active' : 'Inactive' }}
            </AppBadge>
            <AppBadge variant="neutral">{{ field.type_label }}</AppBadge>
          </div>
        </div>
      </div>
    </template>

    <AppPagination :page="page" :last-page="lastPage" :total="total" @go="goTo" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface Field {
  id: number
  name: string
  description: string | null
  type: string
  type_label: string
  is_active: boolean
  created_at: string
}

const columns = [
  { key: 'name',   label: 'Name',    primary: true },
  { key: 'type',   label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'date',   label: 'Created' },
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

const fields = ref<Field[]>([])
const loading = ref(true)
const { search, sort, view, selectedCount, onSelect, onDelete } = useListToolbar()
const { page, lastPage, total, setMeta, goTo } = useListPagination()

async function fetchData() {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<{ data: Field[] | PaginatedResponse<Field> }>(`/fields?page=${page.value}`)
    const d = res.data
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

const tableRows = computed(() =>
  filtered.value.map(f => ({
    name: f.name,
    description: f.description,
    type: f.type_label,
    status: f.is_active ? 'Active' : 'Inactive',
    date: formatDate(f.created_at),
    _raw: f,
  })),
)

function onDeleteRow(_row: Record<string, unknown>, _idx: number) { /* TODO */ }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
