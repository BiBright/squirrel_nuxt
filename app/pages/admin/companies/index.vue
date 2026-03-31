<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <AppBreadcrumb :items="[{ label: 'Companies' }]" />
      </div>

      <div class="col-12">
        <AppPageHeader title="Companies" subtitle="Manage platform companies and their plans" />

        <AppListToolbar v-model:search="search" v-model:sort="sort" v-model:view="view" label="company"
          add-label="Create company" :total-count="filtered.length" :selected-count="selected.length"
          :hide-view-toggle="true" @add="navigateTo('/admin/companies/new')" @delete="onDelete" />

        <div class="companies-table-wrap">
          <div v-if="loading" class="companies-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading companies...</p>
          </div>

          <div v-else-if="filtered.length === 0" class="companies-empty">
            <span class="material-icons-round">domain_disabled</span>
            <p>No companies found.</p>
          </div>

          <table v-else class="companies-table">
            <thead>
              <tr>
                <th class="col-company">Company name</th>
                <th class="col-date">Registration date</th>
                <th>Plan</th>
                <th>Status</th>
                <th class="col-date">Expiration date</th>
                <th class="col-num">Fields</th>
                <th class="col-num">Forms</th>
                <th class="col-num">Requests</th>
                <th class="col-num">Users</th>
                <th class="col-num">Suppliers</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in filtered" :key="company.id" class="companies-table__row"
                :class="{ 'companies-table__row--selected': selected.includes(company.id) }">

                <td class="col-company">
                  <div class="company-cell">
                    <div class="company-avatar" :style="company.logo_url ? {} : { background: avatarColor(company.name) }">
                      <img v-if="company.logo_url" :src="company.logo_url" :alt="company.name" class="company-avatar__img" />
                      <template v-else>{{ initials(company.name) }}</template>
                    </div>
                    <div class="company-cell__info">
                      <NuxtLink :to="`/admin/companies/${company.id}`" class="company-cell__name">{{ company.name }}
                      </NuxtLink>
                      <span class="company-cell__sub">{{ company.city }}, {{ company.country }}</span>
                    </div>
                  </div>
                </td>
                <td class="col-date">{{ formatDate(company.created_at) }}</td>
                <td>{{ company.plan?.name ?? '—' }}</td>
                <td>
                  <AppBadge :variant="company.is_active ? 'success' : 'danger'">
                    {{ company.is_active ? 'Active' : 'Inactive' }}
                  </AppBadge>
                </td>
                <td class="col-date">{{ formatDate(company.plan_expires_at) }}</td>
                <td class="col-num">{{ company.fields_count ?? '—' }}</td>
                <td class="col-num">{{ company.forms_count ?? '—' }}</td>
                <td class="col-num">{{ company.requests_count ?? '—' }}</td>
                <td class="col-num">{{ company.users_count ?? '—' }}</td>
                <td class="col-num">{{ company.suppliers_count ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Plan {
  id: number
  name: string
}

interface Company {
  id: number
  name: string
  country: string
  city: string
  is_active: boolean
  is_trial: boolean
  is_expired: boolean
  plan_expires_at: string | null
  plan: Plan | null
  logo_url: string | null
  users_count: number
  fields_count?: number
  forms_count?: number
  requests_count?: number
  suppliers_count?: number
  created_at: string
}

const companies = ref<Company[]>([])
const loading = ref(true)
const search = ref('')
const sort = ref('recent')
const view = ref<'list' | 'grid'>('list')
const selected = ref<number[]>([])

onMounted(async () => {
  try {
    const api = useApi()
    const res = await api<{ data: Company[] }>('/master/companies')
    console.log('Company:::', JSON.stringify(res.data[0], null, 2))
    companies.value = res.data
  }
  catch (err) {
    console.error('[Companies] fetch failed:', err)
    companies.value = []
  }
  finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  let result = [...companies.value]

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q),
    )
  }

  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return result
})

function onDelete() {
  // TODO: confirm + delete selected
  selected.value = []
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  '#4763E2', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#06B6D4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}
</script>

<style scoped>
.companies-table-wrap {
  overflow-x: auto;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-8);
}

.companies-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
  white-space: nowrap;
}

.companies-table th {
  padding: var(--space-4) var(--space-6);
  font-weight: 400;
  font-size: 16px;
  color: var(--color-text);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.companies-table__row {
  transition: background 0.1s;
}

.companies-table__row:hover td {
  background: var(--color-surface-hover);
}

.companies-table__row--selected td {
  background: var(--color-primary-subtle);
}

.companies-table td {
  padding: var(--space-3) var(--space-4);
  vertical-align: middle;
  background: var(--color-surface);
}

.companies-table__row:last-child td {
  border-bottom: none;
}

.col-company {
  min-width: 220px;
  position: sticky;
  left: 0;
  z-index: 1;
  border-right: 1px solid var(--color-border);
}

.companies-table thead .col-company {
  z-index: 2;
}

.col-date {
  min-width: 130px;
}

.col-num {
  text-align: right;
  min-width: 72px;
}

.company-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.company-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-white);
  overflow: hidden;
}

.company-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.company-cell__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.company-cell__name {
  font-weight: 600;
  color: var(--color-text);
}

.company-cell__sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.companies-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12);
  color: var(--color-text-muted);
  font-size: var(--text-sm);

  .material-icons-round {
    font-size: 40px;
  }
}
</style>
