<template>
  <div>
    <AppPageHeader title="Suppliers" subtitle="Manage your supplier base" />

    <AppListToolbar
      v-model:search="search"
      v-model:sort="sort"
      v-model:view="view"
      label="supplier"
      add-label="New Supplier"
      :total-count="filtered.length"
      :selected-count="selectedCount"
      @add="navigateTo('/suppliers/create')"
      @delete="onDelete"
    />

    <div v-if="loading" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading suppliers...</p>
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
          <NuxtLink :to="`/suppliers/${row._raw.id}`" class="app-table__cell-link">{{ value }}</NuxtLink>
          <span class="app-table__cell-sub">{{ row.email }}</span>
        </template>

        <template #cell-category="{ value }">
          <AppBadge v-if="value" variant="neutral">{{ value }}</AppBadge>
          <span v-else class="text-muted">—</span>
        </template>

        <template #empty>
          <span class="material-icons-round">local_shipping</span>
          <p>No suppliers found.</p>
        </template>
      </AppTable>
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div v-if="filtered.length === 0" class="list-container">
        <div class="list-empty">
          <span class="material-icons-round">local_shipping</span>
          <p>No suppliers found.</p>
        </div>
      </div>

      <div v-else class="list-mosaic">
        <div v-for="supplier in filtered" :key="supplier.id" class="list-card">
          <div class="list-card__header">
            <NuxtLink :to="`/suppliers/${supplier.id}`" class="list-card__title">{{ supplier.name }}</NuxtLink>
          </div>
          <div class="list-card__meta">
            <div class="list-card__meta-row">
              <span class="material-icons-round">email</span>
              {{ supplier.email }}
            </div>
            <div v-if="supplier.contact_person" class="list-card__meta-row">
              <span class="material-icons-round">person</span>
              {{ supplier.contact_person }}
            </div>
            <div v-if="supplier.country" class="list-card__meta-row">
              <span class="material-icons-round">public</span>
              {{ supplier.country }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">calendar_today</span>
              {{ formatDate(supplier.created_at) }}
            </div>
          </div>
          <div class="list-card__footer">
            <AppBadge v-if="supplier.category" variant="neutral">{{ supplier.category }}</AppBadge>
            <span v-else class="text-muted">No category</span>
          </div>
        </div>
      </div>
    </template>

    <AppPagination :page="page" :last-page="lastPage" :total="total" @go="goTo" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface Supplier {
  id: number
  name: string
  email: string
  supplier_number: string | null
  category: string | null
  material_type: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  country: string | null
  created_at: string
}

const columns = [
  { key: 'name',     label: 'Supplier', primary: true },
  { key: 'category', label: 'Category' },
  { key: 'contact',  label: 'Contact' },
  { key: 'country',  label: 'Country' },
  { key: 'date',     label: 'Added' },
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

const suppliers = ref<Supplier[]>([])
const loading = ref(true)
const { search, sort, view, selectedCount, onSelect, onDelete } = useListToolbar()
const { page, lastPage, total, setMeta, goTo } = useListPagination()

async function fetchData() {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<{ data: Supplier[] | PaginatedResponse<Supplier> }>(`/suppliers?page=${page.value}`)
    const d = res.data
    if (Array.isArray(d)) { suppliers.value = d }
    else { suppliers.value = d.data; setMeta(d.meta) }
  }
  catch { suppliers.value = [] }
  finally { loading.value = false }
}

onMounted(fetchData)
watch(page, fetchData)

const filtered = computed(() => {
  let result = [...suppliers.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.category ?? '').toLowerCase().includes(q),
    )
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const tableRows = computed(() =>
  filtered.value.map(s => ({
    name: s.name,
    email: s.email,
    category: s.category,
    contact: s.contact_person ?? '—',
    country: s.country ?? '—',
    date: formatDate(s.created_at),
    _raw: s,
  })),
)

function onDeleteRow(_row: Record<string, unknown>, _idx: number) { /* TODO */ }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
