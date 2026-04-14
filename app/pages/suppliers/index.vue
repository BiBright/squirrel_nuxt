<template>
  <div>

    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Suppliers' }]" />
        </div>

        <AppPageHeader title="Suppliers" />

        <div class="col-12">
          <AppListToolbar v-model:search="search" v-model:sort="sort" v-model:view="view" label="supplier"
            add-label="New Supplier" inactive-to="/suppliers/inactive"
            @add="navigateTo('/suppliers/create')" />
        </div>

        <div class="col-12">
          <div v-if="loading" class="skeleton-rows">
            <div class="skeleton-row"><AppSkeleton width="45%" /><AppSkeleton width="30%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="35%" /><AppSkeleton width="40%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="50%" /><AppSkeleton width="25%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="30%" /><AppSkeleton width="35%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="40%" /><AppSkeleton width="28%" /><AppSkeleton width="15%" /></div>
          </div>

          <AppBlankState v-else-if="blankState.show.value" :image="blankState.image.value"
            :title="blankState.title.value" :message="blankState.message.value">
            <AppButton to="/suppliers/create">
              <span class="material-icons-round">add</span>
              New Supplier
            </AppButton>
          </AppBlankState>

          <template v-else-if="effectiveView === 'list'">
            <AppTable :columns="columns" :rows="tableRows" button-edit button-deactivate
              @edit="(row) => navigateTo(`/suppliers/${row._raw.id}`)" @deactivate="onDeleteRow">
              <template #cell-name="{ value, row }">
                <NuxtLink :to="`/suppliers/${row._raw.id}`" class="app-table__cell-link subheading-1">{{ value }}</NuxtLink>
              </template>

              <template #cell-contact="{ row }">
                <div class="supplier-contact">
                  <span v-if="(row._raw as Supplier).contact_person" class="supplier-contact__name">{{ (row._raw as Supplier).contact_person }}</span>
                  <span v-if="(row._raw as Supplier).contact_phone" class="supplier-contact__phone">
                    {{ [(row._raw as Supplier).phone_code, (row._raw as Supplier).contact_phone].filter(Boolean).join(' ') }}
                  </span>
                  <span v-if="!(row._raw as Supplier).contact_person && !(row._raw as Supplier).contact_phone" class="text-muted">—</span>
                </div>
              </template>

              <template #cell-category="{ value }">
                <AppBadge v-if="value" variant="neutral">{{ value }}</AppBadge>
                <span v-else class="text-muted">—</span>
              </template>
            </AppTable>
          </template>

          <template v-else>
            <div class="list-mosaic">
              <div v-for="supplier in filtered" :key="supplier.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="`/suppliers/${supplier.id}`" class="list-card__title cta2">{{ supplier.name }}</NuxtLink>
                  <button class="list-card__delete" type="button" @click.prevent="onDeleteRow({ _raw: supplier }, 0)">
                    <span class="material-icons-round">delete_outline</span>
                  </button>
                </div>
                <div class="list-card__meta">
                  <div v-if="supplier.supplier_number" class="list-card__meta-row caption3">
                    <span class="material-icons-round">phone</span>
                    {{ supplier.supplier_number }}
                  </div>
                  <div class="list-card__meta-row caption3">
                    <span class="material-icons-round">email</span>
                    {{ supplier.email }}
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

interface Supplier {
  id: number
  name: string
  email: string
  supplier_number: string | null
  category: string | null
  material_type: string | null
  contact_person: string | null
  contact_email: string | null
  phone_code: string | null
  contact_phone: string | null
}

const columns = [
  { key: 'name', label: 'Supplier', primary: true },
  { key: 'email', label: 'Email' },
  { key: 'contact', label: 'Contact' }
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
const suppliers = ref<Supplier[]>([])
const loading = ref(true)
const { search, sort, view } = useListToolbar()
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
    const res = await api<{ data: Supplier[] | PaginatedResponse<Supplier> }>(`/suppliers?page=${page.value}`)
    const d = res.data
    console.log('here the suppliers list:' , d);
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

const blankState = useBlankState(filtered, search, {
  image: '/images/blankPages/suppliers.svg',
  title: 'No suppliers yet',
  message: 'Register your first supplier to send requests.',
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

async function onDeleteRow(row: Record<string, unknown>, _idx: number) {
  const supplier = row._raw as Supplier
  try {
    const api = useApi()
    await api(`/suppliers/${supplier.id}/toggle-active`, { method: 'PATCH' })
    toast.success('Supplier deactivated', { category: 'supplier' })
    await navigateTo('/suppliers/inactive')
  }
  catch (err) {
    toast.error(err, 'Could not deactivate supplier', { category: 'supplier' })
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.supplier-contact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.supplier-contact__name {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.supplier-contact__phone {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
