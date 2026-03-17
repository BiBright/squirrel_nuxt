<template>
  <div>
    <AppPageHeader title="Requests" subtitle="Track and manage your requests" />

    <AppListToolbar
      v-model:search="search"
      v-model:sort="sort"
      v-model:view="view"
      label="request"
      add-label="New Request"
      :total-count="filtered.length"
      :selected-count="selectedCount"
      @add="onAdd"
      @delete="onDelete"
    >
      <template #bulk-actions>
        <div class="toolbar-assign">
          <button class="toolbar-assign__btn" @click.stop="assignMenuOpen = !assignMenuOpen">
            <span class="material-icons-round">person</span>
            Assign to
            <span class="material-icons-round">{{ assignMenuOpen ? 'expand_less' : 'expand_more' }}</span>
          </button>
          <div v-if="assignMenuOpen" v-click-outside="() => assignMenuOpen = false" class="toolbar-assign__panel">
            <div class="toolbar-assign__header">Assign {{ selectedCount }} selected</div>
            <div v-if="loadingUsers" class="toolbar-assign__loading">Loading users...</div>
            <button
              v-for="user in users"
              :key="user.id"
              class="toolbar-assign__option"
              @click="onToolbarAssign(user)"
            >
              <span class="material-icons-round">person_outline</span>
              {{ user.name }}
            </button>
          </div>
        </div>
      </template>
    </AppListToolbar>

    <div v-if="loading" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading requests...</p>
      </div>
    </div>

    <template v-else-if="view === 'list'">
      <RequestsTable
        :requests="filtered"
        :users="users"
        :loading-users="loadingUsers"
        @assign="onAssign"
        @remove="onRemove"
        @bulk-assign="onBulkAssign"
        @bulk-remove="onBulkRemove"
        @selection-change="onSelectionChange"
      />
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div v-if="filtered.length === 0" class="list-container">
        <div class="list-empty">
          <span class="material-icons-round">inbox</span>
          <p>No requests found.</p>
        </div>
      </div>

      <div v-else class="list-mosaic">
        <div v-for="req in filtered" :key="req.id" class="list-card">
          <div class="list-card__header">
            <span class="list-card__title">{{ displayTitle(req) }}</span>
            <button class="list-row-menu-btn" title="Actions">
              <span class="material-icons-round">more_vert</span>
            </button>
          </div>
          <div class="list-card__meta">
            <div class="list-card__meta-row">
              <span class="material-icons-round">description</span>
              {{ req.forms.length }} form{{ req.forms.length !== 1 ? 's' : '' }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">check_circle</span>
              {{ totalCompleted(req) }}/{{ totalEntries(req) }} completed
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">calendar_today</span>
              {{ formatDate(req.created_at) }}
            </div>
          </div>
          <div class="list-card__footer">
            <AppBadge :variant="overallStatusVariant(req)">{{ overallStatusLabel(req) }}</AppBadge>
          </div>
        </div>
      </div>
    </template>
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
const requests = ref<Request[]>([])
const users = ref<User[]>([])
const loading = ref(true)
const loadingUsers = ref(false)
const search = ref('')
const sort = ref('recent')
const view = ref<'list' | 'grid'>('list')
const selectedCount = ref(0)
const selectedEntryIds = ref<number[]>([])
const assignMenuOpen = ref(false)

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
    result = result.filter(r => r.assigned_to?.id === (authStore.user?.id as number))
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(r =>
      (r.title ?? '').toLowerCase().includes(q) ||
      r.forms.some(f => f.form_name.toLowerCase().includes(q)),
    )
  }
  if (sort.value === 'az') result.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  else if (sort.value === 'za') result.sort((a, b) => displayTitle(b).localeCompare(displayTitle(a)))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

function onSelectionChange(entryIds: number[]) {
  selectedEntryIds.value = entryIds
  selectedCount.value = entryIds.length
  if (entryIds.length === 0) assignMenuOpen.value = false
}

async function onToolbarAssign(user: User) {
  assignMenuOpen.value = false
  await onBulkAssign(selectedEntryIds.value, user)
}

async function onAssign(req: Request, user: User) {
  try {
    const api = useApi()
    await api(`/requests/${req.id}/assign`, {
      method: 'PATCH',
      body: { user_id: user.id },
    })
    const target = requests.value.find(r => r.id === req.id)
    if (target) target.assigned_to = { id: user.id, name: user.name }
  }
  catch { /* TODO: show error */ }
}

async function onRemove(req: Request) {
  try {
    const api = useApi()
    await api(`/requests/${req.id}`, { method: 'DELETE' })
    requests.value = requests.value.filter(r => r.id !== req.id)
  }
  catch { /* TODO: show error */ }
}

function onAdd() { navigateTo('/requests/create') }
function onDelete() { selectedCount.value = 0 }

async function onBulkAssign(_entryIds: number[], user: User) {
  // Assign all unique requests that contain any of the selected entries
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
  }
  catch { /* TODO: show error */ }
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
  }
  catch { /* TODO: show error */ }
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

<style scoped>
.toolbar-assign {
  position: relative;
}

.toolbar-assign__btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 500;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text);
  transition: background 0.15s;
}

.toolbar-assign__btn:hover { background: var(--color-surface-hover); }

.toolbar-assign__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 200px;
  overflow: hidden;
}

.toolbar-assign__header {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.toolbar-assign__loading {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.toolbar-assign__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text);
  transition: background 0.1s;
}

.toolbar-assign__option:hover { background: var(--color-surface-hover); }
</style>
