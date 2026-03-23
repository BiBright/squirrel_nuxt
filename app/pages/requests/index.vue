<template>
  <div class="container">
    <div class="row">

      <div class="col-12 col-md-9">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests' }]" />
        </div>
        <AppPageHeader title="Requests" />

        <AppListToolbar v-model:search="search" v-model:sort="sort" :view="'list'" hide-view-toggle label="request"
          add-label="New Request" :total-count="filtered.length" :selected-count="selectedCount" @add="onAdd"
          @delete="onDelete" />

        <div v-if="loading" class="list-container">
          <div class="list-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading requests...</p>
          </div>
        </div>

        <AppBlankState v-else-if="blankState.show.value" :image="blankState.image.value" :title="blankState.title.value"
          :message="blankState.message.value">
          <AppButton @click="onAdd">
            <span class="material-icons-round">add</span>
            New Request
          </AppButton>
        </AppBlankState>

        <RequestsTable v-else :requests="filtered" :users="users" :loading-users="loadingUsers" @assign="onAssign"
          @remove="onRemove" @bulk-assign="onBulkAssign" @bulk-remove="onBulkRemove"
          @selection-change="onSelectionChange" />
      </div>

      <div class="col-12 col-md-3 d-none d-md-block">
        <RequestsFilter :requests="requests" @change="onFilterChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string }
  status: { value: string; label: string }
  submitted_at: string | null
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

const authStore = useAuthStore()
const toast = useAppToast()
const requests = ref<Request[]>([])
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
    await api(`/requests/${req.id}/assign`, { method: 'PATCH', body: { user_id: user.id } })
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

function totalEntries(req: Request): number {
  return req.forms.reduce((sum, f) => sum + f.total, 0)
}

function totalCompleted(req: Request): number {
  return req.forms.reduce((sum, f) => sum + f.completed, 0)
}

type BadgeVariant = 'warning' | 'primary' | 'success' | 'danger' | 'neutral'

function overallStatusVariant(req: Request): BadgeVariant {
  const entries = req.forms.flatMap(f => f.suppliers)
  if (entries.length === 0) return 'neutral'
  if (entries.every(e => e.status.value === 'completed')) return 'success'
  if (entries.some(e => e.status.value === 'pending_approval')) return 'primary'
  if (entries.some(e => e.status.value === 'cancelled')) return 'danger'
  return 'warning'
}

function overallStatusLabel(req: Request): string {
  const entries = req.forms.flatMap(f => f.suppliers)
  if (entries.length === 0) return 'No entries'
  if (entries.every(e => e.status.value === 'completed')) return 'Completed'
  if (entries.some(e => e.status.value === 'pending_approval')) return 'In Review'
  if (entries.some(e => e.status.value === 'cancelled')) return 'Cancelled'
  return 'Awaiting Answer'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
