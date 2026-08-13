<template>
  <div class="container">
    <div class="row">

      <template v-if="!isInactive">
        <div class="col-12 col-md-9">
          <div class="col-12">
            <AppBreadcrumb :items="[{ label: 'Requests' }]" />
          </div>
          <AppPageHeader title="Requests">
            <AppButton v-if="!isSupplier" icon="add" class="d-none d-md-flex" @click="onAdd">New Request</AppButton>
          </AppPageHeader>

          <AppListToolbar v-if="!isSupplier" v-model:search="search" v-model:sort="sort" :view="'list'" hide-view-toggle label="request"
            add-label="New Request" :show-toggle="hasInactiveRequests" :is-active="true" @update:is-active="(v: boolean) => setInactive(!v)" @add="onAdd" />

          <div v-if="loading" class="skeleton-rows">
            <div class="skeleton-row"><AppSkeleton width="45%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="38%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="52%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="33%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="42%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
          </div>

          <template v-else-if="isSupplier">
            <div v-if="filteredSupplierEntries.length === 0" class="list-empty">
              <span class="material-icons-round">inbox</span>
              <p class="cta1">No requests assigned to you.</p>
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
                </div>
                <p class="supplier-entry__date">{{ entry.date }}</p>
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
              @remove="onRemove" @bulk-assign="onBulkAssign" @bulk-remove="onBulkRemove" />
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
      </template>

      <template v-else-if="isSupplier">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests' }]" />
        </div>

        <AppPageHeader title="Inactive Requests" />

        <div class="col-12">
          <div class="deleted-toolbar">
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
        </div>

        <div class="col-12">
          <div v-if="loading" class="skeleton-rows">
            <div class="skeleton-row"><AppSkeleton width="45%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="38%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="52%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="33%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
          </div>
          <div v-else-if="filteredSupplier.length === 0" class="list-container">
            <div class="list-empty">
              <span class="material-icons-round">delete_outline</span>
              <p>No inactive requests.</p>
            </div>
          </div>
          <div v-else class="deleted-list">
            <div v-for="item in filteredSupplier" :key="item.id" class="deleted-item">
              <div class="deleted-item__info">
                <p class="deleted-item__name">{{ item.title || 'Untitled' }}</p>
                <p class="deleted-item__date">Deactivated {{ formatDate(item.updated_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="col-12 col-md-9">
          <div class="col-12">
            <AppBreadcrumb :items="[{ label: 'Requests' }]" />
          </div>

          <AppPageHeader title="Inactive Requests" />

          <AppListToolbar v-model:search="search" v-model:sort="sort" :view="'list'" hide-view-toggle
            label="request" show-toggle :is-active="false" @update:is-active="(v: boolean) => setInactive(!v)" />

          <div v-if="loading" class="skeleton-rows">
            <div class="skeleton-row"><AppSkeleton width="45%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="38%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="52%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
            <div class="skeleton-row"><AppSkeleton width="33%" height="18px" /><AppSkeleton width="8%" height="18px" /></div>
          </div>

          <RequestsTable
            v-else
            :requests="filteredInactive"
            :users="[]"
            inactive
            @activate="onActivate"
            @delete="onDelete"
            @bulk-activate="onBulkActivate"
            @bulk-delete="onBulkDelete"
          />
        </div>

        <div class="col-12 col-md-3 d-none d-md-block">
          <RequestsFilter
            :requests="requestsInactive"
            :users="[]"
            @change="onInactiveFilterChange"
          />
        </div>
      </template>
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

interface RawInactive {
  id: number
  title: string | null
  updated_at: string
  created_at?: string
  forms?: RequestForm[]
}

interface SupplierItem {
  id: number
  title: string | null
  updated_at: string
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
  created_at: string
  forms: SupplierForm[]
}

const route = useRoute()
const router = useRouter()
const isInactive = computed(() => route.query.status === 'inactive')

const authStore = useAuthStore()
const api = useApi()
const toast = useAppToast()
const isSupplier = computed(() => authStore.user?.roles === 'supplier')
const requests = ref<Request[]>([])
const requestsInactive = ref<Request[]>([])
const hasInactiveFlag = ref(false)
const supplierRequests = ref<SupplierRequest[]>([])
const supplierItemsInactive = ref<SupplierItem[]>([])
const users = ref<User[]>([])
const { loading, withMinTime } = useMinLoadingTime()
const loadingUsers = ref(false)
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

const activeFilters = ref({ status: [] as string[], forms: [] as string[], suppliers: [] as string[], assigned: [] as string[] })
const inactiveFilters = ref({ status: [] as string[], forms: [] as string[], suppliers: [] as string[], assigned: [] as string[] })

function setInactive(value: boolean) {
  const query = { ...route.query }
  if (value) query.status = 'inactive'
  else delete query.status
  router.replace({ query })
}

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

async function fetchData() {
  await withMinTime(async () => {
    if (isSupplier.value) {
      if (isInactive.value) {
        try {
          const res = await api<{ data: RawInactive[] }>('/requests/inactive')
          supplierItemsInactive.value = res.data ?? []
        }
        catch { supplierItemsInactive.value = [] }
        return
      }

      try {
        const res = await api<{ data: unknown }>('/supplier/requests')
        const d = res.data as Record<string, unknown>
        const items: unknown[] = Array.isArray(d) ? d : ((d.data as unknown[]) ?? [])
        supplierRequests.value = (items as Record<string, unknown>[]).filter(req => req.is_active !== false).map(req => ({
          request_id: req.id as number,
          title: (req.title as string | null) ?? null,
          company: (req.company as Record<string, unknown>)?.name as string ?? '',
          created_at: req.created_at as string,
          forms: ((req.entries as Record<string, unknown>[]) ?? []).map(e => ({
            entry_id: e.id as number,
            form_name: (e.form as Record<string, unknown>)?.name as string ?? '',
            status: e.status as string,
          })),
        }))
      }
      catch { supplierRequests.value = [] }
      return
    }

    if (isInactive.value) {
      try {
        const res = await api<{ data: RawInactive[] }>('/requests/inactive')
        requestsInactive.value = (res.data ?? []).map(toRequest)
      }
      catch { requestsInactive.value = [] }
      return
    }

    try {
      const res = await api<{ data: Request[] | { data: Request[] }, has_inactive?: boolean }>('/requests')
      const d = res.data
      requests.value = Array.isArray(d) ? d : d.data
      hasInactiveFlag.value = res.has_inactive ?? false
    }
    catch { requests.value = [] }

    loadingUsers.value = true
    try {
      const res = await api<{ data: User[] | { data: User[] } }>('/users')
      const d = res.data
      users.value = Array.isArray(d) ? d : d.data
    }
    catch { users.value = [] }
    finally { loadingUsers.value = false }
  })
}

onMounted(fetchData)
watch(isInactive, fetchData)

const hasInactiveRequests = computed(() => isInactive.value || hasInactiveFlag.value)

const filtered = computed(() => {
  let result = [...requests.value]
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

const filteredInactive = computed(() => {
  let result = [...requestsInactive.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(r =>
      (r.title ?? '').toLowerCase().includes(q) ||
      r.forms.some(f => f.form_name.toLowerCase().includes(q)),
    )
  }
  const af = inactiveFilters.value
  if (af.status.length) result = result.filter(r => r.forms.some(f => f.suppliers.some(s => af.status.includes(s.status.value))))
  if (af.forms.length) result = result.filter(r => r.forms.some(f => af.forms.includes(f.form_name)))
  if (af.suppliers.length) result = result.filter(r => r.forms.some(f => f.suppliers.some(s => af.suppliers.includes(s.supplier?.name ?? ''))))
  if (af.assigned.length) result = result.filter(r => r.assigned_to != null && af.assigned.includes(r.assigned_to.name))
  if (sort.value === 'az') result.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const filteredSupplier = computed(() => {
  let result = [...supplierItemsInactive.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(i => (i.title ?? '').toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
  else result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
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
      date: new Date(req.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function onAssign(req: Request, user: User) {
  try {
    await api(`/requests/${req.id}/assign`, {
      method: 'PATCH',
      body: {
        assignments: req.forms.flatMap(f =>
          f.suppliers.filter(s => s.supplier !== null).map(s => ({ form_id: f.form_id, assigned_to: user.id, supplier_id: s.supplier!.id })),
        ),
      },
    })
    requests.value = requests.value.map(r =>
      r.id !== req.id ? r : {
        ...r,
        assigned_to: { id: user.id, name: user.name },
        forms: r.forms.map(f => ({ ...f, assigned_to: { id: user.id, name: user.name } })),
      },
    )
    toast.success(`Request assigned to ${user.name}`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to assign request', { category: 'request' }) }
}

async function onRemove(req: Request) {
  try {
    await api(`/requests/${req.id}/toggle-active`, { method: 'PATCH' })
    requests.value = requests.value.filter(r => r.id !== req.id)
    toast.success('Request deactivated', { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to deactivate request', { category: 'request' }) }
}

function onFilterChange(f: typeof activeFilters.value) { activeFilters.value = f }
function onInactiveFilterChange(f: typeof inactiveFilters.value) { inactiveFilters.value = f }
function onAdd() { navigateTo('/requests/create') }

async function onBulkAssign(entryIds: number[], user: User) {
  try {
    const affectedReqs = requests.value.filter(r =>
      r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))),
    )
    await Promise.all(affectedReqs.map(r =>
      api(`/requests/${r.id}/assign`, {
        method: 'PATCH',
        body: {
          assignments: r.forms
            .filter(f => f.suppliers.some(s => entryIds.includes(s.id)))
            .flatMap(f =>
              f.suppliers
                .filter(s => entryIds.includes(s.id) && s.supplier !== null)
                .map(s => ({ form_id: f.form_id, assigned_to: user.id, supplier_id: s.supplier!.id })),
            ),
        },
      }),
    ))
    const affectedIds = new Set(affectedReqs.map(r => r.id))
    requests.value = requests.value.map(r =>
      !affectedIds.has(r.id) ? r : {
        ...r,
        forms: r.forms.map(f =>
          f.suppliers.some(s => entryIds.includes(s.id))
            ? {
                ...f,
                assigned_to: { id: user.id, name: user.name },
                suppliers: f.suppliers.map(s =>
                  entryIds.includes(s.id) ? { ...s, assigned_to: { id: user.id, name: user.name } } : s,
                ),
              }
            : f,
        ),
      },
    )
    toast.success(`${affectedReqs.length} request${affectedReqs.length !== 1 ? 's' : ''} assigned to ${user.name}`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to assign requests', { category: 'request' }) }
}

async function onBulkRemove(entryIds: number[]) {
  const affectedReqs = requests.value.filter(r =>
    r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))),
  )
  try {
    await Promise.all(affectedReqs.map(r =>
      api(`/requests/${r.id}/toggle-active`, { method: 'PATCH' }),
    ))
    const removedIds = new Set(affectedReqs.map(r => r.id))
    requests.value = requests.value.filter(r => !removedIds.has(r.id))
    toast.success(`${affectedReqs.length} request${affectedReqs.length !== 1 ? 's' : ''} deactivated`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to deactivate requests', { category: 'request' }) }
}

async function onActivate(req: Request) {
  try {
    await api(`/requests/${req.id}/toggle-active`, { method: 'PATCH' })
    requestsInactive.value = requestsInactive.value.filter(r => r.id !== req.id)
    toast.success('Request activated', { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to activate request', { category: 'request' }) }
}

async function onDelete(req: Request) {
  try {
    await api(`/requests/${req.id}/archive`, { method: 'DELETE' })
    requestsInactive.value = requestsInactive.value.filter(r => r.id !== req.id)
    toast.success('Request deleted', { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to delete request', { category: 'request' }) }
}

async function onBulkActivate(entryIds: number[]) {
  const affected = requestsInactive.value.filter(r => r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))))
  try {
    await Promise.all(affected.map(r => api(`/requests/${r.id}/toggle-active`, { method: 'PATCH' })))
    const ids = new Set(affected.map(r => r.id))
    requestsInactive.value = requestsInactive.value.filter(r => !ids.has(r.id))
    toast.success(`${affected.length} request${affected.length !== 1 ? 's' : ''} activated`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to activate requests', { category: 'request' }) }
}

async function onBulkDelete(entryIds: number[]) {
  const affected = requestsInactive.value.filter(r => r.forms.some(f => f.suppliers.some(s => entryIds.includes(s.id))))
  try {
    await Promise.all(affected.map(r => api(`/requests/${r.id}/archive`, { method: 'DELETE' })))
    const ids = new Set(affected.map(r => r.id))
    requestsInactive.value = requestsInactive.value.filter(r => !ids.has(r.id))
    toast.success(`${affected.length} request${affected.length !== 1 ? 's' : ''} deleted`, { category: 'request' })
  }
  catch (err) { toast.error(err, 'Failed to delete requests', { category: 'request' }) }
}

function displayTitle(req: Request): string {
  return req.title ?? req.forms.map(f => f.form_name).join(', ')
}
</script>

<style scoped>
.supplier-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-8);
}

.supplier-entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
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
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-primary);
}

.supplier-entry__date {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  flex-shrink: 0;
  text-align: center;
}

</style>
