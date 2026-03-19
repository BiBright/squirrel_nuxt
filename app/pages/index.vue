<template>
  <div>
    <AppPageHeader title="Dashboard" :subtitle="`Welcome back, ${userName}`" />

    <div class="dash">

        <!-- Stat cards -->
        <div class="dash-stats dash__stats">
          <div class="dash-stat">
            <p class="dash-stat__label">Requests</p>
            <p class="dash-stat__value">{{ stats.requests }}</p>
          </div>
          <div class="dash-stat">
            <p class="dash-stat__label">Suppliers</p>
            <p class="dash-stat__value">{{ stats.suppliers }}</p>
          </div>
          <div class="dash-stat">
            <p class="dash-stat__label">Forms</p>
            <p class="dash-stat__value">{{ stats.forms }}</p>
          </div>
        </div>

        <!-- Charts row -->
        <div class="dash-charts-row dash__charts">
          <div class="dash-card">
            <h3 class="dash-card__title">Total request vs completed</h3>
            <div v-if="loadingRequests" class="dash-state">Loading...</div>
            <div v-else-if="stats.requests === 0" class="dash-state">No request data yet.</div>
            <ClientOnly v-else>
              <AppChartBar
                :labels="['Total requests', 'Completed']"
                :datasets="[{ label: '', data: [stats.requests, stats.completed], color: ['#367B8A', '#A0E797'] }]"
                :legend="false"
              />
            </ClientOnly>
          </div>

          <div class="dash-card">
            <h3 class="dash-card__title">Requests status</h3>
            <div v-if="loadingRequests" class="dash-state">Loading...</div>
            <div v-else-if="donutData.every(v => v === 0)" class="dash-state">No request data yet.</div>
            <ClientOnly v-else>
              <AppChartDonut
                :labels="['Awaiting answer', 'For Approval', 'Rejected', 'Complete']"
                :data="donutData"
                :colors="['#F3DFA9', '#C5CBE4', '#E49890', '#A0E797']"
                cutout="0%"
              />
            </ClientOnly>
          </div>
        </div>

        <!-- Yearly view -->
        <div class="dash-card dash__yearly">
          <h3 class="dash-card__title">Yearly view</h3>
          <div v-if="loadingRequests" class="dash-state">Loading...</div>
          <div v-else-if="stats.requests === 0" class="dash-state">You don't have any requests yet.</div>
          <ClientOnly v-else>
            <AppChartLine :labels="MONTHS" :datasets="lineDatasets" />
          </ClientOnly>
        </div>

      <!-- ── Right column: Recent requests ─────────────── -->
      <div class="dash__right">
        <div class="dash-recent">
          <div class="dash-recent__header">
            <h2 class="dash-recent__title">Recent requests</h2>
            <NuxtLink to="/requests" class="dash-recent__view-all">View All</NuxtLink>
          </div>

          <div v-if="loadingRequests" class="dash-state" style="padding: var(--space-6)">Loading...</div>
          <div v-else-if="assignedEntries.length === 0 && approvalEntries.length === 0" class="dash-state" style="padding: var(--space-6)">
            No recent requests.
          </div>

          <template v-else>
            <!-- Assigned to you -->
            <template v-if="assignedEntries.length > 0">
              <p class="dash-group-label">Assigned to you</p>
              <NuxtLink
                v-for="entry in assignedEntries"
                :key="`a-${entry.requestId}-${entry.formId}-${entry.supplierId}`"
                :to="`/requests/${entry.requestId}/edit`"
                class="dash-entry"
              >
                <div class="dash-entry__main">
                  <p class="dash-entry__title">({{ entry.requestId }}) {{ entry.formName }}</p>
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

            <!-- For approval -->
            <template v-if="approvalEntries.length > 0">
              <p class="dash-group-label" :class="{ 'dash-group-label--spaced': assignedEntries.length > 0 }">For Approval</p>
              <NuxtLink
                v-for="entry in approvalEntries"
                :key="`p-${entry.requestId}-${entry.formId}-${entry.supplierId}`"
                :to="`/requests/${entry.requestId}/edit`"
                class="dash-entry"
              >
                <div class="dash-entry__main">
                  <p class="dash-entry__title">({{ entry.requestId }}) {{ entry.formName }}</p>
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
      </div><!-- /.dash__right -->
    </div><!-- /.dash -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const userName = computed(() => (authStore.user as Record<string, string> | null)?.name ?? 'there')

interface RequestEntry {
  id: number
  supplier: { id: number; name: string }
  status: { value: string; label: string }
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const requests = ref<Request[]>([])
const loadingRequests = ref(true)
const supplierCount = ref(0)
const formCount = ref(0)

onMounted(async () => {
  const api = useApi()
  const [reqRes, supRes, formRes] = await Promise.allSettled([
    api<{ data: Request[] | { data: Request[] } }>('/requests'),
    api<{ data: unknown[] | { data: unknown[] } }>('/suppliers'),
    api<{ data: unknown[] | { data: unknown[] } }>('/forms'),
  ])

  if (reqRes.status === 'fulfilled') {
    const d = reqRes.value.data
    requests.value = Array.isArray(d) ? d : d.data
  }
  loadingRequests.value = false

  if (supRes.status === 'fulfilled') {
    const d = supRes.value.data
    supplierCount.value = (Array.isArray(d) ? d : d.data).length
  }
  if (formRes.status === 'fulfilled') {
    const d = formRes.value.data
    formCount.value = (Array.isArray(d) ? d : d.data).length
  }
})

// ── Stats ─────────────────────────────────────────────────
const stats = computed(() => ({
  requests: ownRequests.value.length,
  completed: ownRequests.value.filter(r =>
    r.forms.flatMap(f => f.suppliers).every(e => e.status.value === 'completed'),
  ).length,
  suppliers: supplierCount.value,
  forms: formCount.value,
}))

// ── Pie chart ────────────────────────────────────────────
const donutData = computed(() => {
  const c = { awaiting_answer: 0, pending_approval: 0, cancelled: 0, completed: 0 }
  ownRequests.value.forEach(r =>
    r.forms.flatMap(f => f.suppliers).forEach((e) => {
      if (e.status.value in c) c[e.status.value as keyof typeof c]++
    }),
  )
  return [c.awaiting_answer, c.pending_approval, c.cancelled, c.completed]
})

// ── Line chart ───────────────────────────────────────────
const lineDatasets = computed(() => {
  const total = new Array(12).fill(0)
  const completed = new Array(12).fill(0)
  ownRequests.value.forEach((r) => {
    const m = new Date(r.created_at).getMonth()
    total[m]++
    const entries = r.forms.flatMap(f => f.suppliers)
    if (entries.length > 0 && entries.every(e => e.status.value === 'completed')) completed[m]++
  })
  return [
    { label: 'Total Requests', data: total, color: '#367B8A' },
    { label: 'Completed Requests', data: completed, color: '#A0E797' },
  ]
})

// ── Recent entries ───────────────────────────────────────
interface FlatEntry {
  requestId: number
  formId: number
  formName: string
  supplierId: number
  supplierName: string
  date: string
  time: string
  status: string
  updatedAt: string
}

function flattenEntries(reqs: Request[]): FlatEntry[] {
  return reqs.flatMap(r =>
    r.forms.flatMap(f =>
      f.suppliers.map(e => ({
        requestId: r.id,
        formId: f.form_id,
        formName: f.form_name,
        supplierId: e.supplier.id,
        supplierName: e.supplier.name,
        date: new Date(e.updated_at).toLocaleDateString('en-CA'),
        time: new Date(e.updated_at).toLocaleTimeString('en-GB'),
        status: e.status.value,
        updatedAt: e.updated_at,
      })),
    ),
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

const myId = computed(() => authStore.user?.id as number)
const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')

const ownRequests = computed(() =>
  isCompanyUser.value
    ? requests.value.filter(r => r.created_by?.id === myId.value)
    : requests.value,
)

const assignedEntries = computed(() => {
  const source = isCompanyUser.value
    ? ownRequests.value
    : requests.value.filter(r => r.assigned_to?.id === myId.value)
  return flattenEntries(source).slice(0, 6)
})

const approvalEntries = computed(() =>
  flattenEntries(ownRequests.value).filter(e => e.status === 'pending_approval').slice(0, 6),
)
</script>

<style scoped>
/* ── Main layout ──────────────────────────────────────── */
.dash {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: start;
}

/* order on small screens: stats → recent → charts → yearly */
.dash__stats   { order: 1; }
.dash__right   { order: 2; }
.dash__charts  { order: 3; }
.dash__yearly  { order: 4; }

@media (min-width: 1536px) {
  .dash {
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: var(--space-6);
  }

  .dash__stats  { grid-column: 1; order: unset; }
  .dash__charts { grid-column: 1; order: unset; }
  .dash__yearly { grid-column: 1; order: unset; }
  .dash__right  { grid-column: 2; grid-row: 1 / span 4; order: unset; position: sticky; top: var(--space-6); }
}

/* ── Stat cards ───────────────────────────────────────── */
.dash-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .dash-stats {
    grid-template-columns: repeat(3, 1fr);
  }
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

/* ── Charts row ───────────────────────────────────────── */
.dash-charts-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .dash-charts-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

/* ── Generic card ─────────────────────────────────────── */
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

.dash-card > :last-child {
  margin-top: auto;
}

/* ── Yearly card: prevent chart overflow ─────────────── */
.dash__yearly {
  min-width: 0;
  overflow: hidden;
}

/* ── Right panel ──────────────────────────────────────── */
.dash__right {}

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
.dash-recent__view-all:hover { text-decoration: underline; }

/* ── Group label ──────────────────────────────────────── */
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

/* ── Entry row ────────────────────────────────────────── */
.dash-entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  text-decoration: none;
  transition: background 0.1s;
}
.dash-entry:hover { background: var(--color-surface-hover); }

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

/* ── Empty / loading state ────────────────────────────── */
.dash-state {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: left;
}
</style>
