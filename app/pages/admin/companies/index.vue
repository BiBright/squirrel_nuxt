<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <AppBreadcrumb :items="[{ label: 'Companies' }]" />
      </div>

      <div class="col-12">
    <AppPageHeader title="Companies" subtitle="Manage platform companies and their plans" />

    <AppListToolbar
      v-model:search="search"
      v-model:sort="sort"
      v-model:view="view"
      label="company"
      add-label="New Company"
      :total-count="filtered.length"
      :selected-count="selected.length"
      @add="onAdd"
      @delete="onDelete"
    />

    <!-- LIST VIEW -->
    <template v-if="effectiveView === 'list'">
      <div class="list-container">
        <div v-if="loading" class="list-empty">
          <span class="material-icons-round">hourglass_empty</span>
          <p>Loading companies...</p>
        </div>

        <div v-else-if="filtered.length === 0" class="list-empty">
          <span class="material-icons-round">domain_disabled</span>
          <p>No companies found.</p>
        </div>

        <template v-else>
          <div class="list-header company-list-header">
            <div class="list-col-check">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            </div>
            <div>Company</div>
            <div>Plan</div>
            <div class="company-col-status">Status</div>
            <div class="company-col-date">Registered</div>
            <div class="company-col-stats">Users</div>
            <div></div>
          </div>

          <div
            v-for="company in filtered"
            :key="company.id"
            class="list-row company-list-row"
            :class="{ 'list-row--selected': selected.includes(company.id) }"
          >
            <div class="list-col-check">
              <input type="checkbox" :checked="selected.includes(company.id)" @change="toggleSelect(company.id)" />
            </div>

            <div class="list-col-title">
              <span class="list-col-title__name">{{ company.name }}</span>
              <span class="list-col-title__sub">{{ company.city }}, {{ company.country }}</span>
            </div>

            <div>
              <AppBadge v-if="company.plan" :variant="'primary'">
                {{ company.plan.name }}
              </AppBadge>
              <AppBadge v-else variant="neutral">No plan</AppBadge>
            </div>

            <div class="company-col-status">
              <AppBadge :variant="company.is_active ? 'success' : 'danger'">
                {{ company.is_active ? 'Active' : 'Inactive' }}
              </AppBadge>
              <AppBadge v-if="company.is_trial" variant="neutral">Trial</AppBadge>
            </div>

            <div class="company-col-date">{{ formatDate(company.created_at) }}</div>

            <div class="company-col-stats">{{ company.users_count }}</div>

            <div class="list-col-menu">
              <button class="list-row-menu-btn" title="Actions">
                <span class="material-icons-round">more_vert</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div v-if="loading || filtered.length === 0" class="list-container">
        <div class="list-empty">
          <span class="material-icons-round">{{ loading ? 'hourglass_empty' : 'domain_disabled' }}</span>
          <p>{{ loading ? 'Loading companies...' : 'No companies found.' }}</p>
        </div>
      </div>

      <div v-else class="list-mosaic">
        <div v-for="company in filtered" :key="company.id" class="list-card">
          <div class="list-card__header">
            <span class="list-card__title">{{ company.name }}</span>
            <button class="list-row-menu-btn" title="Actions">
              <span class="material-icons-round">more_vert</span>
            </button>
          </div>

          <div class="list-card__meta">
            <div class="list-card__meta-row">
              <span class="material-icons-round">location_on</span>
              {{ company.city }}, {{ company.country }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">calendar_today</span>
              {{ formatDate(company.created_at) }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">person</span>
              {{ company.users_count }} users
            </div>
          </div>

          <div class="list-card__footer">
            <AppBadge v-if="company.plan" variant="primary">{{ company.plan.name }}</AppBadge>
            <AppBadge v-else variant="neutral">No plan</AppBadge>
            <AppBadge :variant="company.is_active ? 'success' : 'danger'">
              {{ company.is_active ? 'Active' : 'Inactive' }}
            </AppBadge>
            <AppBadge v-if="company.is_trial" variant="neutral">Trial</AppBadge>
          </div>
        </div>
      </div>
    </template>
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
  plan: Plan | null
  users_count: number
  created_at: string
}

const companies = ref<Company[]>([])
const loading = ref(true)

const search = ref('')
const sort = ref('recent')
const view = ref<'list' | 'grid'>('list')
const isMobile = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', e => { isMobile.value = e.matches })
})
const effectiveView = computed(() => isMobile.value ? 'grid' : view.value)
const selected = ref<number[]>([])

onMounted(async () => {
  try {
    const api = useApi()
    const res = await api<{ data: { data: Company[] } }>('/company')
    companies.value = res.data.data
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
      c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q),
    )
  }

  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return result
})

const allSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every(c => selected.value.includes(c.id)),
)

function toggleSelect(id: number) {
  const idx = selected.value.indexOf(id)
  if (idx === -1) selected.value.push(id)
  else selected.value.splice(idx, 1)
}

function toggleAll() {
  allSelected.value ? (selected.value = []) : (selected.value = filtered.value.map(c => c.id))
}

function onAdd() {
  navigateTo('/admin/companies/create')
}

function onDelete() {
  // TODO: confirm + delete selected
  selected.value = []
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
