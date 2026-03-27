<template>
  <div class="container">
    <div class="row">

      <div class="col-12 col-md-9">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests' }]" />
        </div>
        <AppPageHeader title="Requests" />

        <AppListToolbar v-if="!isSupplier" v-model:search="search" v-model:sort="sort" :view="'list'" hide-view-toggle label="request"
          add-label="New Request" :total-count="filtered.length" :selected-count="selectedCount" @add="onAdd"
          @delete="onDelete" />

        <div v-if="loading" class="list-container">
          <div class="list-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading requests...</p>
          </div>
        </div>

        <template v-else-if="isSupplier">
          <div v-if="filteredSupplierEntries.length === 0" class="list-empty">
            <span class="material-icons-round">inbox</span>
            <p>No requests assigned to you.</p>
          </div>
          <div v-else class="supplier-list">
            <NuxtLink
              v-for="entry in filteredSupplierEntries"
              :key="entry.entryId"
              :to="`/requests/${entry.requestId}/entries/${entry.entryId}`"
              class="supplier-entry"
            >
              <div class="supplier-entry__main">
                <p class="supplier-entry__name">{{ entry.formName }}</p>
                <p class="supplier-entry__date">{{ entry.date }}</p>
              </div>
              <AppBadge :variant="entry.statusVariant">{{ entry.statusLabel }}</AppBadge>
            </NuxtLink>
          </div>
        </template>

        <template v-else>
          <AppBlankState v-if="blankState.show.value" :image="blankState.image.value" :title="blankState.title.value"
            :message="blankState.message.value">
            <AppButton @click="onAdd">
              <span class="material-icons-round">add</span>
              New Request
            </AppButton>
          </AppBlankState>

          <RequestsTable v-else :requests="filtered" :users="users" :loading-users="loadingUsers" @assign="onAssign"
            @remove="onRemove" @bulk-assign="onBulkAssign" @bulk-remove="onBulkRemove"
            @selection-change="onSelectionChange" />
        </template>
      </div>

      <div class="col-12 col-md-3 d-none d-md-block">
        <RequestsFilter
          v-if="isSupplier"
          :requests="supplierRequestsForFilter"
          :users="[]"
          supplier-mode
          @change="onSupplierFilterChange"
        />
        <RequestsFilter
          v-else
          :requests="requests"
          :users="users"
          @change="onFilterChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string } | null
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
}

interface Request {
  id: number
  title: string | null
  assigned_to: { id: number; name: string } | null
  created_by: { id: number; name: string } | null
  forms: RequestForm[]
  created_at: string
}

interface User {
  id: number
  name: string
}

interface SupplierForm {
  entry_id: number
  form_name: string
  status: string
}

interface SupplierRequest {
  request_id: number
  title: string | null
  company: string
  forms: SupplierForm[]
}

const authStore = useAuthStore()
const toast = useAppToast()
const isSupplier = computed(() => authStore.user?.roles === 'supplier')
const requests = ref<Request[]>([])
const supplierRequests = ref<SupplierRequest[]>([])
const users = ref<User[]>([])
const loading = ref(true)
const loadingUsers = ref(false)
const search = ref('')
const sort = ref('recent')
const view = ref<'list' | 'grid'>('list')
const selectedCount = ref(0)
const selectedEntryIds = ref<number[]>([])
const activeFilters = ref({ status: [] as string[], forms: [] as string[], suppliers: [] as string[], assigned: [] as string[] })

onMounted(async () => {
  const api = useApi()

  if (isSupplier.value) {
    try {
      const res = await api<{ data: SupplierRequest[] }>('/supplier/requests')
      supplierRequests.value = res.data
    }
    catch { supplierRequests.value = [] }
    finally { loading.value = false }
    return
  }

  try {
    const res = await api<{ data: Request[] | { data: Request[] } }>('/requests')
    const d = res.data
    requests.value = Array.isArray(d) ? d : d.data
  }
  catch { requests.value = [] }
  finally { loading.value = false }

  loadingUsers.value = true
  try {
    const res = await api<{ data: User[] | { data: User[] } }>('/users')
    const d = res.data
    users.value = Array.isArray(d) ? d : d.data
  }
  catch { users.value = [] }
  finally { loadingUsers.value = false }
})

const filtered = computed(() => {
  let result = [...requests.value]
  if (authStore.user?.roles === 'company-user') {
    result = result.filter(r => r.created_by?.id === (authStore.user?.id as number))
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(r =>
      (r.title ?? '').toLowerCase().includes(q) ||
      r.forms.some(f => f.form_name.toLowerCase().includes(q)),
    )
  }
  const af = activeFilters.value
  if (af.status.length) result = result.filter(r => r.forms.some(f => f.suppliers.some(s => af.status.includes(s.status.value))))
  if (af.forms.length) result = result.filter(r => r.forms.some(f => af.forms.includes(f.form_name)))
  if (af.suppliers.length) result = result.filter(r => r.forms.some(f => f.suppliers.some(s => af.suppliers.includes(s.supplier.name))))
  if (af.assigned.length) result = result.filter(r => r.assigned_to != null && af.assigned.includes(r.assigned_to.name))
  if (sort.value === 'az') result.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  else if (sort.value === 'za') result.sort((a, b) => displayTitle(b).localeCompare(displayTitle(a)))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

type BadgeVariant = 'warning' | 'primary' | 'success' | 'danger' | 'neutral'
function entryStatusVariant(status: string): BadgeVariant {
  if (status === 'completed') return 'success'
  if (status === 'pending_approval') return 'primary'
  if (status === 'cancelled') return 'danger'
  return 'warning'
}

const supplierEntries = computed(() =>
  supplierRequests.value.flatMap(req =>
    req.forms.map(form => ({
      requestId: req.request_id,
      entryId: form.entry_id,
      formName: form.form_name,
      status: form.status,
      statusLabel: form.status.replace(/_/g, ' '),
      statusVariant: entryStatusVariant(form.status),
      date: '—',
    })),
  ),
)

const supplierActiveFilters = ref({ status: [] as string[], forms: [] as string[] })

const filteredSupplierEntries = computed(() => {
  let result = supplierEntries.value
  const af = supplierActiveFilters.value
  if (af.status.length) result = result.filter(e => af.status.includes(e.status))
  if (af.forms.length) result = result.filter(e => af.forms.includes(e.formName))
  return result
})

const supplierRequestsForFilter = computed(() =>
  supplierRequests.value.map(r => ({
    id: r.request_id,
    title: r.title,
    assigned_to: null,
    forms: r.forms.map(f => ({
      form_id: f.entry_id,
      form_name: f.form_name,
      suppliers: [],
    })),
  })),
)

function onSupplierFilterChange(f: { status: string[], forms: string[], suppliers: string[], assigned: string[] }) {
  supplierActiveFilters.value = { status: f.status, forms: f.forms }
}

const blankState = useBlankState(filtered, search, {
  image: '/images/blankPages/requests.svg',
  title: 'No requests yet',
  message: 'Create your first request to get started.',
})

function onSelectionChange(entryIds: number[]) {
  selectedEntryIds.value = entryIds
  selectedCount.value = entryIds.length
}

async function onAssign(req: Request, user: User) {
  try {
    const api = useApi()
    await api(`/requests/${req.id}/assign`, { method: 'PATCH', body: { assigned_to: user.id } })
    const target = requests.value.find(r => r.id === req.id)
    if (target) target.assigned_to = { id: user.id, name: user.name }
    toast.success(`Request assigned to ${user.name}`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to assign request', { category: 'request' }) }
}

async function onRemove(req: Request) {
  try {
    const api = useApi()
    await api(`/requests/${req.id}`, { method: 'DELETE' })
    requests.value = requests.value.filter(r => r.id !== req.id)
    toast.success('Request removed', { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to remove request', { category: 'request' }) }
}

function onFilterChange(f: typeof activeFilters.value) { activeFilters.value = f }
function onAdd() { navigateTo('/requests/create') }
function onDelete() { selectedCount.value = 0 }

async function onBulkAssign(_entryIds: number[], user: User) {
  const affectedReqs = requests.value.filter(r =>
    r.forms.some(f => f.suppliers.some(s => _entryIds.includes(s.id))),
  )
  try {
    const api = useApi()
    await Promise.all(affectedReqs.map(r =>
      api(`/requests/${r.id}/assign`, { method: 'PATCH', body: { user_id: user.id } }),
    ))
    affectedReqs.forEach(r => {
      const target = requests.value.find(req => req.id === r.id)
      if (target) target.assigned_to = { id: user.id, name: user.name }
    })
    toast.success(`${affectedReqs.length} request${affectedReqs.length !== 1 ? 's' : ''} assigned to ${user.name}`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to assign requests', { category: 'request' }) }
}

async function onBulkRemove(entryIds: number[]) {
  const affectedReqs = requests.value.filter(r =>
    r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))),
  )
  try {
    const api = useApi()
    await Promise.all(affectedReqs.map(r =>
      api(`/requests/${r.id}`, { method: 'DELETE' }),
    ))
    const removedIds = new Set(affectedReqs.map(r => r.id))
    requests.value = requests.value.filter(r => !removedIds.has(r.id))
    toast.success(`${affectedReqs.length} request${affectedReqs.length !== 1 ? 's' : ''} removed`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to remove requests', { category: 'request' }) }
}

function displayTitle(req: Request): string {
  return req.title ?? req.forms.map(f => f.form_name).join(', ')
}

</script>

<style scoped>
.supplier-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-8);
}

.supplier-entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background 0.1s;
}

.supplier-entry:hover {
  background: var(--color-surface-hover);
}

.supplier-entry__main {
  flex: 1;
  min-width: 0;
}

.supplier-entry__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.supplier-entry__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 2px;
}

</style>
