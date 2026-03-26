<template>
  <div class="requests-filter">

    <div class="requests-filter__header">
      <span class="title02">Filters</span>
      <span class="material-icons-round">filter_list</span>
    </div>


    <div class="requests-filter__selection">
      <div class="requests-filter__group">
        <button class="requests-filter__group-toggle" @click="toggle('forms')">
          <span class="material-icons-round">format_list_bulleted</span>
          <p class="caption1 text-grey">Forms</p>
          <span class="material-icons-round requests-filter__chevron">{{ open.forms ? 'expand_less' : 'expand_more'
            }}</span>
        </button>

        <div v-if="open.forms" class="requests-filter__options">
          <input v-model="search.forms" class="requests-filter__search" type="search" placeholder="Search forms..." />
          <label v-for="f in filteredForms" :key="f" class="requests-filter__option"
            :class="{ 'is-active': filters.forms.includes(f) }">
            <input type="checkbox" :value="f" :checked="filters.forms.includes(f)" @change="toggleFilter('forms', f)" />
            <span>{{ f }}</span>
          </label>
          <p v-if="filteredForms.length === 0" class="requests-filter__empty">No forms found.</p>
        </div>
      </div>

      <div class="requests-filter__group">
        <button class="requests-filter__group-toggle" @click="toggle('suppliers')">
          <span class="material-icons-round">local_shipping</span>
          <p class="caption1 text-grey">Suppliers</p>
          <span class="material-icons-round requests-filter__chevron">{{ open.suppliers ? 'expand_less' : 'expand_more'
            }}</span>
        </button>

        <div v-if="open.suppliers" class="requests-filter__options">
          <input v-model="search.suppliers" class="requests-filter__search" type="search"
            placeholder="Search suppliers..." />
          <label v-for="s in filteredSuppliers" :key="s" class="requests-filter__option"
            :class="{ 'is-active': filters.suppliers.includes(s) }">
            <input type="checkbox" :value="s" :checked="filters.suppliers.includes(s)"
              @change="toggleFilter('suppliers', s)" />
            <span>{{ s }}</span>
          </label>
          <p v-if="filteredSuppliers.length === 0" class="requests-filter__empty">No suppliers found.</p>
        </div>
      </div>

      <!-- Status -->
      <div class="requests-filter__group">
        <button class="requests-filter__group-toggle" @click="toggle('status')">
          <span class="material-icons-round">pending_actions
          </span>
          <p class="caption1 text-grey">Status</p>
          <span class="material-icons-round requests-filter__chevron">{{ open.status ? 'expand_less' : 'expand_more'
            }}</span>
        </button>

        <div v-if="open.status" class="requests-filter__options">
          <label v-for="s in STATUS_OPTIONS" :key="s.value" class="requests-filter__option"
            :class="{ 'is-active': filters.status.includes(s.value) }">
            <input type="checkbox" :value="s.value" :checked="filters.status.includes(s.value)"
              @change="toggleFilter('status', s.value)" />
            <AppBadge :variant="s.variant">{{ s.label }}</AppBadge>
          </label>
        </div>
      </div>

      <!-- Assigned To -->
      <div class="requests-filter__group">
        <button class="requests-filter__group-toggle" @click="toggle('assigned')">
          <span class="material-icons-round">person</span>
          <p class="caption1 text-grey">Assigned To</p>
          <span class="material-icons-round requests-filter__chevron">{{ open.assigned ? 'expand_less' : 'expand_more'
            }}</span>
        </button>

        <div v-if="open.assigned" class="requests-filter__options">
          <input v-model="search.assigned" class="requests-filter__search" type="search"
            placeholder="Search users..." />
          <label v-for="u in filteredAssigned" :key="u" class="requests-filter__option"
            :class="{ 'is-active': filters.assigned.includes(u) }">
            <input type="checkbox" :value="u" :checked="filters.assigned.includes(u)"
              @change="toggleFilter('assigned', u)" />
            <span>{{ u }}</span>
          </label>
          <p v-if="filteredAssigned.length === 0" class="requests-filter__empty">No users found.</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Request {
  id: number
  title: string | null
  assigned_to: { id: number; name: string } | null
  forms: {
    form_id: number
    form_name: string
    suppliers: {
      supplier: { id: number; name: string }
      status: { value: string; label: string }
    }[]
  }[]
}

type BadgeVariant = 'warning' | 'primary' | 'success' | 'danger' | 'neutral'

const STATUS_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: 'awaiting_answer', label: 'Awaiting Answer', variant: 'warning' },
  { value: 'pending_approval', label: 'For Approval', variant: 'primary' },
  { value: 'cancelled', label: 'Rejected', variant: 'danger' },
  { value: 'completed', label: 'Complete', variant: 'success' },
]

interface User {
  id: number
  name: string
}

const props = defineProps<{ requests: Request[]; users: User[] }>()

const emit = defineEmits<{
  change: [filters: {
    status: string[]
    forms: string[]
    suppliers: string[]
    assigned: string[]
  }]
}>()

const open = reactive({ status: false, forms: false, suppliers: false, assigned: false })
const search = reactive({ forms: '', suppliers: '', assigned: '' })

const filters = reactive<{
  status: string[]
  forms: string[]
  suppliers: string[]
  assigned: string[]
}>({
  status: [],
  forms: [],
  suppliers: [],
  assigned: [],
})

// ── Derived option lists from request data ────────────────
const allForms = computed(() =>
  [...new Set(props.requests.flatMap(r => r.forms.map(f => f.form_name)))].sort(),
)

const allSuppliers = computed(() =>
  [...new Set(props.requests.flatMap(r =>
    r.forms.flatMap(f => f.suppliers.map(s => s.supplier.name)),
  ))].sort(),
)

const allAssigned = computed(() =>
  [...props.users.map(u => u.name)].sort(),
)

// ── Filtered option lists (search) ───────────────────────
const filteredForms = computed(() => {
  const q = search.forms.toLowerCase()
  return q ? allForms.value.filter(f => f.toLowerCase().includes(q)) : allForms.value
})

const filteredSuppliers = computed(() => {
  const q = search.suppliers.toLowerCase()
  return q ? allSuppliers.value.filter(s => s.toLowerCase().includes(q)) : allSuppliers.value
})

const filteredAssigned = computed(() => {
  const q = search.assigned.toLowerCase()
  return q ? allAssigned.value.filter(u => u.toLowerCase().includes(q)) : allAssigned.value
})

// ── Helpers ───────────────────────────────────────────────
const hasActiveFilters = computed(() =>
  filters.status.length > 0 || filters.forms.length > 0 ||
  filters.suppliers.length > 0 || filters.assigned.length > 0,
)

function toggle(key: keyof typeof open) {
  open[key] = !open[key]
}

function toggleFilter(key: keyof typeof filters, value: string) {
  const arr = filters[key]
  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
  emit('change', { ...filters })
}

</script>

<style scoped>
.requests-filter {
  position: sticky;
  top: 0;
  background-color: var(--color-white);
  padding: 0 24px;
  margin-right: -20px;
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

.requests-filter__header {
  display: inline-flex;
  justify-content: start;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-4) var(--space-12);
}

.requests-filter__selection {
  display: grid;
  gap: 16px;
}

.requests-filter__title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text);
  flex: 1;
}

.requests-filter__clear {
  font-size: var(--text-xs);
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.requests-filter__clear:hover {
  text-decoration: underline;
}

.requests-filter__group-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  text-align: left;
  transition: background 0.1s;
}

.requests-filter__group-toggle:hover {
  border-radius: var(--radius-md);
  background: var(--color-primary-25);
}

.requests-filter__group-toggle .material-icons-round:first-child {
  font-size: 18px;
  color: var(--color-text-muted);
}

.requests-filter__chevron {
  margin-left: auto;
  font-size: 18px !important;
  color: var(--color-text-muted);
}

.requests-filter__options {
  background-color: #f9f9f9;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.requests-filter__search {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  margin-bottom: var(--space-1);
  outline: none;
}

.requests-filter__search:focus {
  border-color: var(--color-primary);
}

.requests-filter__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-1) 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text);
  transition: background 0.1s;
}

.requests-filter__option:hover {
  background: var(--color-surface-hover);
}

.requests-filter__option.is-active {
  background: var(--color-primary-subtle);
}

.requests-filter__option input[type="checkbox"] {
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.requests-filter__empty {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  padding: var(--space-1) 0;
}
</style>
