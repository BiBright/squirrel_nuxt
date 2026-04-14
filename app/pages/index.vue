<template>
  <div class="dash-container">
    <div class="container">

      <!-- ── Master Admin dashboard ── -->
      <template v-if="isMaster">
        <AppPageHeader title="Dashboard" />

        <div v-if="loadingRequests" class="skeleton-master">
          <div class="skeleton-master__bar">
            <AppSkeleton width="13%" height="32px" />
            <AppSkeleton width="13%" height="32px" />
            <AppSkeleton width="13%" height="32px" />
            <AppSkeleton width="13%" height="32px" />
            <AppSkeleton width="13%" height="32px" />
          </div>
          <div class="skeleton-master__cards">
            <div class="skeleton-form skeleton-master__card"><AppSkeleton height="120px" /></div>
            <div class="skeleton-form skeleton-master__card"><AppSkeleton height="120px" /></div>
            <div class="skeleton-form skeleton-master__card"><AppSkeleton height="120px" /></div>
          </div>
        </div>

        <template v-else>
          <div class="master-bar">
            <div class="master-bar__item">
              <span class="master-bar__value">{{ masterData?.overview?.companies ?? '—' }}</span>
              <span class="master-bar__label">Companies</span>
            </div>
            <div class="master-bar__item">
              <span class="master-bar__value">{{ masterData?.overview?.fields ?? '—' }}</span>
              <span class="master-bar__label">Fields</span>
            </div>
            <div class="master-bar__item">
              <span class="master-bar__value">{{ masterData?.overview?.forms ?? '—' }}</span>
              <span class="master-bar__label">Forms</span>
            </div>
            <div class="master-bar__item">
              <span class="master-bar__value">{{ masterData?.overview?.requests ?? '—' }}</span>
              <span class="master-bar__label">Requests</span>
            </div>
            <div class="master-bar__item">
              <span class="master-bar__value">{{ masterData?.overview?.suppliers ?? '—' }}</span>
              <span class="master-bar__label">Suppliers</span>
            </div>
            <div class="master-bar__item">
              <span class="master-bar__value">{{ masterData?.overview?.users ?? '—' }}</span>
              <span class="master-bar__label">Users</span>
            </div>
          </div>

          <div class="row master-cards">
            <div class="col-12 col-sm-4">
              <div class="master-card">
                <div class="master-card__top">
                  <div class="master-card__icon-box">
                    <span class="material-icons-round">local_shipping</span>
                  </div>
                  <div class="master-card__info">
                    <p class="master-card__label">Companies</p>
                    <p class="master-card__value">{{ masterData?.companies.total ?? '—' }}</p>
                  </div>
                </div>
                <div class="master-card__rows">
                  <div v-for="item in masterData?.companies.by_plan" :key="item.plan" class="master-card__row">
                    <span>{{ item.plan }}</span>
                    <span>{{ item.count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-4">
              <div class="master-card">
                <div class="master-card__top">

                  <div class="master-card__icon-box">
                    <span class="material-icons-round">groups</span>
                  </div>
                  <div class="master-card__info">
                    <p class="master-card__label">Users</p>
                    <p class="master-card__value">{{ masterData?.users.total ?? '—' }}</p>
                  </div>
                </div>
                <div class="master-card__rows">
                  <div class="master-card__row">
                    <span>Suppliers</span><span>{{ masterData?.users.suppliers ?? '—' }}</span>
                  </div>
                  <div class="master-card__row">
                    <span>Company Users</span><span>{{ masterData?.users.company_users ?? '—' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-4">
              <div class="master-card">
                <div class="master-card__top">
                  <div class="master-card__icon-box">
                    <span class="material-icons-round">format_list_bulleted</span>
                  </div>
                  <div class="master-card__info">
                    <p class="master-card__label">Requests</p>
                    <p class="master-card__value">{{ masterData?.requests.total ?? '—' }}</p>
                  </div>
                </div>
                <div class="master-card__rows">
                  <div class="master-card__row">
                    <span>Forms</span><span>{{ masterData?.requests.forms ?? '—' }}</span>
                  </div>
                  <div class="master-card__row">
                    <span>Fields</span><span>{{ masterData?.requests.fields ?? '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <template v-else>
        <AppPageHeader title="Dashboard">
          <div v-if="!isSupplier" ref="excelMenuRef" class="dash-excel-menu">
            <button class="dash-excel-btn" @click="excelMenuOpen = !excelMenuOpen">
              <span class="material-icons-round">more_horiz</span>
            </button>
            <div v-if="excelMenuOpen" class="dash-excel-dropdown">
              <button class="dash-excel-option" disabled>
                <span class="material-icons-round">download</span>
                Download Excel
              </button>
            </div>
          </div>
        </AppPageHeader>

        <div class="dash">
          <div class="dash__left">
          <div v-if="!isSupplier" class="dash__stats">
            <div class="row">
              <div class="col-12 col-sm-4">
                <div class="dash-stat">
                  <p class="dash-stat__label">Requests</p>
                  <p class="dash-stat__value">{{ stats.requests }}</p>
                </div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="dash-stat">
                  <p class="dash-stat__label">Suppliers</p>
                  <p class="dash-stat__value">{{ stats.suppliers }}</p>
                </div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="dash-stat">
                  <p class="dash-stat__label">Forms</p>
                  <p class="dash-stat__value">{{ stats.forms }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="dash__charts">
            <div class="dash-card">
              <h3 class="dash-card__title">Total request vs completed</h3>
              <AppSkeleton v-if="loadingRequests" class="skeleton-chart" />
              <div v-else-if="stats.requests === 0" class="dash-state">No request data yet.</div>
              <ClientOnly v-else>
                <AppChartBar :labels="['Total requests', 'Completed']"
                  :datasets="[{ label: '', data: [stats.requests, stats.completed], color: ['#367B8A', '#A0E797'] }]"
                  :legend="false" />
              </ClientOnly>
            </div>

            <div class="dash-card">
              <h3 class="dash-card__title">Requests status</h3>
              <AppSkeleton v-if="loadingRequests" class="skeleton-chart" />
              <div v-else-if="stats.requests === 0" class="dash-state">No request data yet.</div>
              <ClientOnly v-else>
                <AppChartDonut
                  :labels="['Awaiting answer', 'For Approval', 'Rejected', 'Complete']"
                  :data="[stats.awaiting, stats.approval, stats.rejected, stats.completed]"
                  :colors="['#F3DFA9', '#C5CBE4', '#E49890', '#A0E797']"
                  cutout="0%"
                />
              </ClientOnly>
            </div>
          </div>

          <div class="dash__yearly">
            <div class="dash-card">
              <h3 class="dash-card__title">Yearly view</h3>
              <AppSkeleton v-if="loadingRequests || loadingGraphic" class="skeleton-chart" />
              <div v-else-if="yearlyDatasets.every(ds => ds.data.every(v => v === 0))" class="dash-state">No data for this year yet.</div>
              <ClientOnly v-else>
                <AppChartLine :labels="yearlyLabels" :datasets="yearlyDatasets" />
              </ClientOnly>
            </div>
          </div>
          </div><!-- end dash__left -->

          <div class="dash__right">
            <div class="dash-recent">
              <div class="dash-recent__header">
                <h2 class="dash-recent__title">Recent requests</h2>
                <NuxtLink to="/requests" class="dash-recent__view-all">View All</NuxtLink>
              </div>

              <div v-if="loadingRequests" class="skeleton-recent">
                <div class="skeleton-row"><AppSkeleton width="60%" /><AppSkeleton width="18%" /></div>
                <div class="skeleton-row"><AppSkeleton width="50%" /><AppSkeleton width="18%" /></div>
                <div class="skeleton-row"><AppSkeleton width="55%" /><AppSkeleton width="18%" /></div>
              </div>
              <div v-else-if="assignedEntries.length === 0 && approvalEntries.length === 0" class="dash-state"
                style="padding: var(--space-6)">
                No recent requests.
              </div>

              <template v-else>
                <template v-if="assignedEntries.length > 0">
                  <p class="dash-group-label">Recent</p>
                  <NuxtLink v-for="(entry, i) in assignedEntries" :key="`a-${i}`"
                    :to="entry.entryId ? `/requests/${entry.requestId}/entries/${entry.entryId}` : `/requests/${entry.requestId}`"
                    class="dash-entry">
                    <div class="dash-entry__main">
                      <p class="dash-entry__title">{{ entry.formName }}</p>
                      <p class="dash-entry__supplier">{{ entry.supplierName }}</p>
                    </div>
                    <div class="dash-entry__right">
                      <div class="dash-entry__date">
                        <span>{{ entry.date }}</span>
                        <span>{{ entry.time }}</span>
                      </div>
                      <span class="material-icons-round dash-entry__arrow">arrow_forward</span>
                    </div>
                  </NuxtLink>
                </template>

                <template v-if="approvalEntries.length > 0">
                  <p class="dash-group-label" :class="{ 'dash-group-label--spaced': assignedEntries.length > 0 }">For
                    Approval</p>
                  <NuxtLink v-for="(entry, i) in approvalEntries" :key="`p-${i}`"
                    :to="entry.entryId ? `/requests/${entry.requestId}/entries/${entry.entryId}` : `/requests/${entry.requestId}`"
                    class="dash-entry">
                    <div class="dash-entry__main">
                      <p class="dash-entry__title">{{ entry.formName }}</p>
                      <p class="dash-entry__supplier">{{ entry.supplierName }}</p>
                    </div>
                    <div class="dash-entry__right">
                      <div class="dash-entry__date">
                        <span>{{ entry.date }}</span>
                        <span>{{ entry.time }}</span>
                      </div>
                      <span class="material-icons-round dash-entry__arrow">arrow_forward</span>
                    </div>
                  </NuxtLink>
                </template>
              </template>
            </div>
          </div>
        </div>

      </template><!-- end v-else regular dashboard -->
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

interface RequestEntry {
  id: number
  status: { value: string; label: string }
  updated_at: string
}
interface RequestForm {
  form_id: number
  form_name: string
  suppliers: RequestEntry[]
}
interface Request {
  id: number
  forms: RequestForm[]
}
interface CardStats {
  countRequests: number
  countCompleted: number
  countForms: number
  countSuppliers: number
  countAwaiting: number
  countApproval: number
  countRejected: number
}
interface GraphicData {
  allMonths: string[]
  allFormsFill: number[]
  allFormsNotFill: number[]
}
interface DashboardAssigned {
  entry_id: number
  request_id: number
  editado: string
  status: string
  form: { id: number; name: string } | null
  supplier: { id: number; name: string } | null
}
interface DashboardSupplierItem {
  entry_id: number
  request_id: number
  form_name: string
  supplier_name: string
  editado: string
  estado: string
}
interface DashboardRecentRequest {
  request_id: number
  formname: string
  supplierlist: DashboardSupplierItem[]
}
interface FlatEntry {
  requestId: number
  entryId: number | null
  formName: string
  supplierName: string
  date: string
  time: string
  status: string
  updatedAt: string
}

interface MasterDashboard {
  overview: { companies: number; fields: number; forms: number; requests: number; suppliers: number; users: number }
  companies: { total: number; by_plan: { plan: string; count: number }[] }
  users: { total: number; suppliers: number; company_users: number }
  requests: { total: number; forms: number; fields: number }
}

const requests = ref<Request[]>([])
const cardStats = ref<CardStats | null>(null)
const graphicData = ref<GraphicData | null>(null)
const recentData = ref<{ assigned: DashboardAssigned[]; cleanSearchData: DashboardRecentRequest[] } | null>(null)
const masterData = ref<MasterDashboard | null>(null)
const loadingRequests = ref(true)
const loadingGraphic = ref(false)
const excelMenuOpen = ref(false)
const excelMenuRef = ref<HTMLElement | null>(null)
onClickOutside(excelMenuRef, () => { excelMenuOpen.value = false })
const isMaster = computed(() => authStore.user?.roles === 'master')
const isSupplier = computed(() => authStore.user?.roles === 'supplier')

onMounted(async () => {
  console.log('[Dashboard] auth user:', authStore.user)
  console.log('[Dashboard] auth company:', authStore.company)
  const api = useApi()
  try {
    if (isMaster.value) {
      const res = await api<{ data: MasterDashboard }>('/master/dashboard').catch(() => null)
      masterData.value = res?.data ?? null
    }
    else if (isSupplier.value) {
      const res = await api<{ data: Request[] | { data: Request[] } }>('/requests')
      const d = res.data
      requests.value = Array.isArray(d) ? d : (d as { data: Request[] }).data ?? []
    }
    else {
      loadingGraphic.value = true
      const [cardRes, recentRes, graphicRes] = await Promise.allSettled([
        api<{ data: CardStats }>('/dashboard/card'),
        api<{ data: typeof recentData.value }>('/dashboard/recent-data'),
        api<{ data: GraphicData }>('/dashboard/graphic'),
      ])
      if (cardRes.status === 'fulfilled') cardStats.value = cardRes.value.data
      if (recentRes.status === 'fulfilled') recentData.value = recentRes.value.data
      if (graphicRes.status === 'fulfilled') graphicData.value = graphicRes.value.data
      loadingGraphic.value = false
    }
  }
  finally {
    loadingRequests.value = false
  }
})

const allSupplierEntries = computed(() =>
  requests.value.flatMap(r => r.forms.flatMap(f => f.suppliers)),
)

const stats = computed(() => {
  if (isSupplier.value) {
    const entries = allSupplierEntries.value
    const completed = entries.filter(e => e.status.value === 'completed').length
    const approval = entries.filter(e => e.status.value === 'pending_approval').length
    const rejected = entries.filter(e => e.status.value === 'rejected').length
    const awaiting = entries.length - completed - approval - rejected
    return {
      requests: entries.length,
      completed,
      pending: entries.length - completed,
      awaiting: Math.max(0, awaiting),
      approval,
      rejected,
      suppliers: 0,
      forms: 0,
    }
  }
  return {
    requests: cardStats.value?.countRequests ?? 0,
    completed: cardStats.value?.countCompleted ?? 0,
    pending: 0,
    awaiting: cardStats.value?.countAwaiting ?? 0,
    approval: cardStats.value?.countApproval ?? 0,
    rejected: cardStats.value?.countRejected ?? 0,
    suppliers: cardStats.value?.countSuppliers ?? 0,
    forms: cardStats.value?.countForms ?? 0,
  }
})

function toFlatEntry(updatedAt: string, requestId: number, entryId: number | null, formName: string, supplierName: string, status: string): FlatEntry {
  return {
    requestId,
    entryId,
    formName,
    supplierName,
    date: new Date(updatedAt).toLocaleDateString('en-CA'),
    time: new Date(updatedAt).toLocaleTimeString('en-GB'),
    status,
    updatedAt,
  }
}

const assignedEntries = computed((): FlatEntry[] => {
  if (isSupplier.value) {
    return requests.value
      .flatMap(r => r.forms.flatMap(f =>
        f.suppliers.map(e => toFlatEntry(e.updated_at, r.id, e.id, f.form_name, authStore.user?.name as string ?? '', e.status.value)),
      ))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
  }
  return (recentData.value?.cleanSearchData ?? [])
    .flatMap(r => (r.supplierlist ?? []).map(s =>
      toFlatEntry(s.editado, r.request_id, s.entry_id, s.form_name, s.supplier_name, s.estado),
    ))
    .slice(0, 6)
})

const yearlyLabels = computed<string[]>(() => {
  if (!isSupplier.value && graphicData.value?.allMonths) return graphicData.value.allMonths
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
})

const yearlyDatasets = computed(() => {
  if (!isSupplier.value && graphicData.value) {
    return [
      { label: 'Filled', data: graphicData.value.allFormsFill, color: '#A0E797' },
      { label: 'Not Filled', data: graphicData.value.allFormsNotFill, color: '#E49890' },
    ]
  }
  const year = new Date().getFullYear()
  const totalByMonth = Array(12).fill(0)
  const completedByMonth = Array(12).fill(0)
  allSupplierEntries.value.forEach((e) => {
    const d = new Date(e.updated_at)
    if (d.getFullYear() === year) {
      const m = d.getMonth()
      totalByMonth[m]++
      if (e.status.value === 'completed') completedByMonth[m]++
    }
  })
  return [
    { label: 'Total Requests', data: totalByMonth, color: '#A0C4E7' },
    { label: 'Completed', data: completedByMonth, color: '#A0E797' },
  ]
})

const approvalEntries = computed((): FlatEntry[] => {
  if (isSupplier.value) {
    return requests.value
      .flatMap(r => r.forms.flatMap(f =>
        f.suppliers
          .filter(e => e.status.value === 'pending_approval')
          .map(e => toFlatEntry(e.updated_at, r.id, e.id, f.form_name, authStore.user?.name as string ?? '', e.status.value)),
      ))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
  }
  return (recentData.value?.assigned ?? []).map(e =>
    toFlatEntry(e.editado, e.request_id, e.entry_id, e.form?.name ?? '', e.supplier?.name ?? '', e.status),
  )
})
</script>

<style scoped>
.dash-container {
  margin-top: 68px;
}

.dash {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding-block: var(--space-4);
}

.dash {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-block: var(--space-4);
}

.dash__left {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dash__charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (min-width: 1280px) {
  .dash {
    flex-direction: row;
    gap: var(--space-6);
  }

  .dash__left {
    flex: 1;
    gap: var(--space-6);
  }

  .dash__right {
    flex: 1;
  }

  .dash__charts { gap: var(--space-6); }
}

.dash-excel-menu {
  position: relative;
}

.dash-excel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  color: var(--color-text);
  transition: border-color 0.15s;

  &:hover { border-color: var(--color-primary); }
  .material-icons-round { font-size: 20px; }
}

.dash-excel-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  overflow: hidden;
}

.dash-excel-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: not-allowed;
  opacity: 0.6;
  text-align: left;

  .material-icons-round { font-size: 18px; }
}

.dash-stat {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
}

.dash-stat__label {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.dash-stat__value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.dash-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.dash-card__title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-4);
  line-height: 1.3;
}

.dash-recent {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.dash-recent__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
}

.dash-recent__title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
}

.dash-recent__view-all {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
}

.dash-recent__view-all:hover {
  text-decoration: underline;
}

.dash-group-label {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  padding: var(--space-3) var(--space-5);
  border-left: 3px solid var(--color-border);
  margin-left: var(--space-5);
  margin-right: var(--space-5);
}

.dash-group-label--spaced {
  margin-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

.dash-entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  text-decoration: none;
  transition: background 0.1s;
}

.dash-entry:hover {
  background: var(--color-surface-hover);
}

.dash-entry__main {
  flex: 1;
  min-width: 0;
}

.dash-entry__title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-entry__supplier {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
}

.dash-entry__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.dash-entry__date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.dash-entry__arrow {
  color: var(--color-primary);
  font-size: 18px;
}

.dash-state {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: left;
}

.master-bar {
  display: flex;
  gap: var(--space-6);
  flex-wrap: wrap;
  padding: var(--space-4) 0 var(--space-6);
}

.master-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.master-bar__value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
}

.master-bar__label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.master-cards {
  padding-bottom: var(--space-8);
}

.master-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-4);
  padding: var(--space-5);
}

.master-card__top {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.master-card__icon-box {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
  font-size: 28px;

  @media (min-width: 1280px) {
    width: 116px;
    height: 116px;
  }

  .material-icons-round {
    font-size: 40px;

    @media (min-width: 1280px) {
      font-size: 64px;
    }
  }
}

.master-card__info {
  width: -webkit-fill-available;
  display: grid;
}

.master-card__label {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-primary);
}

.master-card__value {
  margin-top: auto;
  text-align: end;
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1.1;
}

.master-card__rows {
  display: grid;
  gap: var(--space-2);
}

.master-card__row {
  background-color: var(--color-primary-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text);
  border-radius: var(--radius-md);
}

.master-card__row:last-child {
  border-bottom: none;
}

.master-card__row span:last-child {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
