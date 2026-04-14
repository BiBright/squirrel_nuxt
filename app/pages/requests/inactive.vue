<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <AppBreadcrumb :items="[{ label: 'Requests', to: '/requests' }, { label: 'Inactive Requests' }]" />
      </div>

      <AppPageHeader title="Inactive Requests" />

      <div class="col-12">
        <div v-if="isSupplier" class="deleted-toolbar">
          <div class="input-search-wrap">
            <span class="material-icons-round input-search-wrap__icon">search</span>
            <input v-model="search" type="text" class="input-search" placeholder="Search requests..." />
          </div>
          <div ref="sortRef" class="sort-dropdown">
            <button class="sort-dropdown__btn" :class="{ 'is-open': sortOpen }" @click="sortOpen = !sortOpen">
              <span class="material-icons-round">sort</span>
              {{ sortLabel }}
              <span class="material-icons-round sort-dropdown__chevron">{{ sortOpen ? 'expand_less' : 'expand_more' }}</span>
            </button>
            <div v-if="sortOpen" class="sort-dropdown__panel">
              <button v-for="opt in sortOptions" :key="opt.value" class="sort-dropdown__option"
                :class="{ 'is-active': sort === opt.value }" @click="sort = opt.value; sortOpen = false">
                <span v-if="sort === opt.value" class="material-icons-round sort-dropdown__check">check</span>
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
        <AppListToolbar v-else v-model:search="search" v-model:sort="sort" :view="'list'" hide-view-toggle hide-add label="request" />
      </div>

      <div class="col-12">
        <div v-if="loading" class="skeleton-rows">
          <div class="skeleton-row"><AppSkeleton width="45%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
          <div class="skeleton-row"><AppSkeleton width="38%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
          <div class="skeleton-row"><AppSkeleton width="52%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
          <div class="skeleton-row"><AppSkeleton width="33%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
        </div>
        <div v-else-if="isSupplier && filteredSupplier.length === 0" class="list-container">
          <div class="list-empty">
            <span class="material-icons-round">delete_outline</span>
            <p>No inactive requests.</p>
          </div>
        </div>
        <div v-else-if="isSupplier" class="deleted-list">
          <div v-for="item in filteredSupplier" :key="item.id" class="deleted-item">
            <div class="deleted-item__info">
              <p class="deleted-item__name">{{ item.title || 'Untitled' }}</p>
              <p class="deleted-item__date">Deactivated {{ formatDate(item.updated_at) }}</p>
            </div>
          </div>
        </div>
        <RequestsTable
          v-else
          :requests="filtered"
          :users="[]"
          inactive
          @activate="onActivate"
          @delete="onDelete"
          @bulk-activate="onBulkActivate"
          @bulk-delete="onBulkDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface RawInactive {
  id: number
  title: string | null
  updated_at: string
  created_at?: string
  forms?: RequestForm[]
}

interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string } | null
  assigned_to: { id: number; name: string } | null
  status: { value: string; label: string }
  submitted_at: string | null
  created_at: string
  updated_at: string
}

interface RequestForm {
  form_id: number
  form_name: string
  total: number
  completed: number
  suppliers: RequestEntry[]
  assigned_to: { id: number; name: string } | null
}

interface Request {
  id: number
  title: string | null
  assigned_to: { id: number; name: string } | null
  created_by: { id: number; name: string } | null
  forms: RequestForm[]
  created_at: string
}

interface SupplierItem {
  id: number
  title: string | null
  updated_at: string
}

const authStore = useAuthStore()
const api = useApi()
const toast = useAppToast()

const isSupplier = computed(() => authStore.user?.roles === 'supplier')

const loading = ref(true)
const requests = ref<Request[]>([])
const supplierItems = ref<SupplierItem[]>([])
const search = ref('')
const sort = ref('recent')
const sortOpen = ref(false)
const sortRef = ref<HTMLElement | null>(null)

onClickOutside(sortRef, () => { sortOpen.value = false })

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A to Z' },
]
const sortLabel = computed(() => sortOptions.find(o => o.value === sort.value)?.label ?? 'Sort')

function toRequest(r: RawInactive): Request {
  if (Array.isArray(r.forms) && r.forms.length > 0) {
    return r as Request
  }
  return {
    id: r.id,
    title: r.title,
    assigned_to: null,
    created_by: null,
    created_at: r.created_at ?? r.updated_at,
    forms: [{
      form_id: r.id,
      form_name: r.title ?? 'Untitled',
      total: 0,
      completed: 0,
      suppliers: [],
      assigned_to: null,
    }],
  }
}

onMounted(async () => {
  try {
    const res = await api<{ data: RawInactive[] }>('/requests/inactive')
    const data = res.data ?? []
    if (isSupplier.value) {
      supplierItems.value = data
    }
    else {
      requests.value = data.map(toRequest)
    }
  }
  catch { requests.value = []; supplierItems.value = [] }
  finally { loading.value = false }
})

function displayTitle(req: Request): string {
  return req.title ?? req.forms.map(f => f.form_name).join(', ')
}

const filtered = computed(() => {
  let result = [...requests.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(r =>
      (r.title ?? '').toLowerCase().includes(q) ||
      r.forms.some(f => f.form_name.toLowerCase().includes(q)),
    )
  }
  if (sort.value === 'az') result.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const filteredSupplier = computed(() => {
  let result = [...supplierItems.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(i => (i.title ?? '').toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
  else result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  return result
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function onActivate(req: Request) {
  try {
    await api(`/requests/${req.id}/toggle-active`, { method: 'PATCH' })
    requests.value = requests.value.filter(r => r.id !== req.id)
    toast.success('Request activated', { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to activate request', { category: 'request' }) }
}

async function onDelete(req: Request) {
  try {
    await api(`/requests/${req.id}/archive`, { method: 'DELETE' })
    requests.value = requests.value.filter(r => r.id !== req.id)
    toast.success('Request deleted', { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to delete request', { category: 'request' }) }
}

async function onBulkActivate(entryIds: number[]) {
  const affected = requests.value.filter(r => r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))))
  try {
    await Promise.all(affected.map(r => api(`/requests/${r.id}/toggle-active`, { method: 'PATCH' })))
    const ids = new Set(affected.map(r => r.id))
    requests.value = requests.value.filter(r => !ids.has(r.id))
    toast.success(`${affected.length} request${affected.length !== 1 ? 's' : ''} activated`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to activate requests', { category: 'request' }) }
}

async function onBulkDelete(entryIds: number[]) {
  const affected = requests.value.filter(r => r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))))
  try {
    await Promise.all(affected.map(r => api(`/requests/${r.id}/archive`, { method: 'DELETE' })))
    const ids = new Set(affected.map(r => r.id))
    requests.value = requests.value.filter(r => !ids.has(r.id))
    toast.success(`${affected.length} request${affected.length !== 1 ? 's' : ''} deleted`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to delete requests', { category: 'request' }) }
}
</script>
