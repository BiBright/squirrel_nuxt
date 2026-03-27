<template>
  <div class="request-table">

    <div v-if="requests.length === 0" class="request-table__empty">
      <span class="material-icons-round">inbox</span>
      <p>No requests found.</p>
    </div>

    <div v-for="{ req, form } in flatItems" :key="`${req.id}-${form.form_id}`" class="request-table__group">

      <div class="request-table__header"
        :class="{ 'request-table__header--selected': isGroupSelected(form), 'request-table__header--closed': !expanded.has(groupKey(req, form)) }">

        <div class="request-table__col request-table__col--check">
          <input type="checkbox" :checked="isGroupSelected(form)" :indeterminate="isGroupIndeterminate(form)"
            @change="toggleGroup(form)" />
        </div>

        <button class="request-table__chevron" @click="toggleExpand(groupKey(req, form))">
          <span class="material-icons-round">
            {{ expanded.has(groupKey(req, form)) ? 'expand_less' : 'expand_more' }}
          </span>
        </button>

        <span class="request-table__title">
          {{ form.form_name }}
        </span>

        <span class="request-table__progress">
          {{ form.completed }}/{{ form.total }}
        </span>

        <div class="request-table__more-wrapper" @click.stop>
          <button class="request-table__more-btn" :class="{ 'is-active': openMenu === groupKey(req, form) }" @click.stop="toggleMenu(groupKey(req, form))">
            <span class="material-icons-round">more_horiz</span>
          </button>

          <div v-if="openMenu === groupKey(req, form)" class="request-table__more-panel">

            <div class="request-table__more-item request-table__more-item--info">
              <span class="material-icons-round">check_box</span>
              {{ selectedInGroup(form).length }} supplier{{ selectedInGroup(form).length !== 1 ? 's' : '' }} selected
            </div>

            <button class="request-table__more-item request-table__more-item--expandable"
              @click="groupMenuSection = groupMenuSection === 'assign' ? 'none' : 'assign'">
              <span class="material-icons-round">person</span>
              Assign to
              <span class="material-icons-round request-table__more-chevron">{{ groupMenuSection === 'assign' ? 'expand_less' :
                'expand_more' }}</span>
            </button>
            <div v-if="groupMenuSection === 'assign'" class="request-table__assignee-list">
              <div v-if="loadingUsers" class="request-table__assignee-loading">Loading users...</div>
              <button v-for="user in users" :key="user.id" class="request-table__assignee-option"
                :class="{ 'is-selected': req.assigned_to?.id === user.id }" @click="emit('assign', req, user)">
                <span class="material-icons-round">person_outline</span>
                {{ user.name }}
                <span v-if="req.assigned_to?.id === user.id"
                  class="material-icons-round request-table__assignee-check">check</span>
              </button>
            </div>

            <button class="request-table__more-item request-table__more-item--danger" @click="emit('remove', req); closeMenu()">
              <span class="material-icons-round">delete</span>
              Remove request
            </button>

          </div>
        </div>
      </div>

      <div v-if="expanded.has(groupKey(req, form))" class="request-table__entries">
        <div class="request-table__entries-header">
          <div class="request-table__col request-table__col--check">Select</div>
          <div class="request-table__col request-table__col--supplier">Supplier</div>
          <div class="request-table__col request-table__col--date">Created at</div>
          <div class="request-table__col request-table__col--date">Updated at</div>
          <div class="request-table__col request-table__col--assigned">Assigned to</div>
          <div class="request-table__col request-table__col--status">Status</div>
          <div class="request-table__col request-table__col--action">More</div>
        </div>

        <div v-for="entry in form.suppliers" :key="entry.id" class="request-table__entry"
            :class="{ 'request-table__entry--selected': selectedEntries.has(entry.id) }">
            <div class="request-table__col request-table__col--check">
              <input type="checkbox" :checked="selectedEntries.has(entry.id)" @change="toggleEntry(entry.id)" />
            </div>
            <div class="request-table__col request-table__col--supplier">
              <NuxtLink :to="`/requests/${req.id}/entries/${entry.id}`" class="request-table__supplier-link">{{ entry.supplier.name }}
              </NuxtLink>
            </div>
            <div class="request-table__col request-table__col--date">{{ formatDate(entry.created_at) }}</div>
            <div class="request-table__col request-table__col--date">{{ formatDate(entry.updated_at) }}</div>
            <div class="request-table__col request-table__col--assigned">{{ req.assigned_to?.name ?? '—' }}</div>
            <div class="request-table__col request-table__col--status">
              <AppBadge :variant="statusVariant(entry.status.value)">
                {{ entry.status.label }}
              </AppBadge>
            </div>

            <div class="request-table__col request-table__col--action">
              <div class="request-table__more-wrapper" @click.stop>
                <button class="request-table__more-btn" :class="{ 'is-active': openEntryMenu === entry.id }"
                  @click.stop="toggleEntryMenu(entry.id)">
                  <span class="material-icons-round">more_horiz</span>
                </button>

                <div v-if="openEntryMenu === entry.id" class="request-table__more-panel request-table__more-panel--entry">

                  <template v-if="selectedEntries.has(entry.id) && selectedEntries.size > 1">

                    <div class="request-table__more-item request-table__more-item--section">Selected Requests</div>

                    <div class="request-table__more-item request-table__more-item--selected-count">
                      <AppBadge variant="neutral">{{ selectedEntries.size }} Selected</AppBadge>
                      <button class="request-table__clear-btn" @click="clearSelection">
                        Clear <span class="material-icons-round"
                          style="font-size:12px;vertical-align:middle">close</span>
                      </button>
                    </div>

                    <button class="request-table__more-item request-table__more-item--expandable" @click="toggleEntrySection('bulk-assign')">
                      <span class="material-icons-round">person</span>
                      Assignee User
                      <span class="material-icons-round request-table__more-chevron">{{ entryMenuSection === 'bulk-assign' ?
                        'expand_less' : 'expand_more' }}</span>
                    </button>
                    <div v-if="entryMenuSection === 'bulk-assign'" class="request-table__assignee-list">
                      <div v-if="loadingUsers" class="request-table__assignee-loading">Loading users...</div>
                      <button v-for="user in users" :key="user.id" class="request-table__assignee-option"
                        @click="emit('bulkAssign', [...selectedEntries], user); closeEntryMenu()">
                        <span class="material-icons-round">person_outline</span>
                        {{ user.name }}
                      </button>
                    </div>

                    <button class="request-table__more-item request-table__more-item--danger"
                      @click="emit('bulkRemove', [...selectedEntries]); closeEntryMenu()">
                      <span class="material-icons-round">delete</span>
                      Remove requests
                    </button>

                    <div class="request-table__more-item request-table__more-item--section"
                      style="border-top: 1px solid var(--color-border); margin-top: 2px;">This Request</div>
                  </template>

                  <NuxtLink :to="`/requests/${req.id}/entries/${entry.id}`" class="request-table__more-item request-table__more-item--link"
                    @click="closeEntryMenu()">
                    <span class="material-icons-round">edit</span>
                    Edit Request
                  </NuxtLink>

                  <button class="request-table__more-item request-table__more-item--expandable" @click="toggleEntrySection('single-assign')">
                    <span class="material-icons-round">person</span>
                    Assignee User
                    <span class="material-icons-round request-table__more-chevron">{{ entryMenuSection === 'single-assign' ?
                      'expand_less' :
                      'expand_more' }}</span>
                  </button>
                  <div v-if="entryMenuSection === 'single-assign'" class="request-table__assignee-list">
                    <div v-if="loadingUsers" class="request-table__assignee-loading">Loading users...</div>
                    <button v-for="user in users" :key="user.id" class="request-table__assignee-option"
                      :class="{ 'is-selected': req.assigned_to?.id === user.id }"
                      @click="emit('assign', req, user); closeEntryMenu()">
                      <span class="material-icons-round">person_outline</span>
                      {{ user.name }}
                      <span v-if="req.assigned_to?.id === user.id"
                        class="material-icons-round request-table__assignee-check">check</span>
                    </button>
                  </div>

                  <button class="request-table__more-item request-table__more-item--danger" @click="emit('remove', req); closeEntryMenu()">
                    <span class="material-icons-round">delete</span>
                    Remove request
                  </button>

                </div>
              </div>
            </div>
          </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string }
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

const props = defineProps<{
  requests: Request[]
  users: User[]
  loadingUsers?: boolean
}>()

const emit = defineEmits<{
  assign: [request: Request, user: User]
  remove: [request: Request]
  selectionChange: [entryIds: number[]]
  bulkAssign: [entryIds: number[], user: User]
  bulkRemove: [entryIds: number[]]
}>()

useEventListener('click', () => { closeMenu(); closeEntryMenu() })

const flatItems = computed(() =>
  props.requests.flatMap(req => req.forms.map(form => ({ req, form })))
)

function groupKey(req: Request, form: RequestForm): string {
  return `${req.id}-${form.form_id}`
}

const expanded = ref<Set<string>>(new Set())
const selectedEntries = ref<Set<number>>(new Set())
const openMenu = ref<string | null>(null)
const openEntryMenu = ref<number | null>(null)
const groupMenuSection = ref<'none' | 'assign'>('none')
const entryMenuSection = ref<'none' | 'single-assign' | 'bulk-assign'>('none')

function selectedInGroup(form: RequestForm): number[] {
  return form.suppliers.map(e => e.id).filter(id => selectedEntries.value.has(id))
}

function isGroupSelected(form: RequestForm): boolean {
  return form.suppliers.length > 0 && form.suppliers.every(e => selectedEntries.value.has(e.id))
}

function isGroupIndeterminate(form: RequestForm): boolean {
  const sel = form.suppliers.filter(e => selectedEntries.value.has(e.id))
  return sel.length > 0 && sel.length < form.suppliers.length
}

function toggleGroup(form: RequestForm) {
  if (isGroupSelected(form)) {
    form.suppliers.forEach(e => selectedEntries.value.delete(e.id))
  }
  else {
    form.suppliers.forEach(e => selectedEntries.value.add(e.id))
  }
  emit('selectionChange', [...selectedEntries.value])
}

function toggleEntry(id: number) {
  selectedEntries.value.has(id)
    ? selectedEntries.value.delete(id)
    : selectedEntries.value.add(id)
  emit('selectionChange', [...selectedEntries.value])
}

function clearSelection() {
  selectedEntries.value.clear()
  emit('selectionChange', [])
}

function toggleExpand(key: string) {
  expanded.value.has(key) ? expanded.value.delete(key) : expanded.value.add(key)
}

function toggleMenu(key: string) {
  openMenu.value = openMenu.value === key ? null : key
  groupMenuSection.value = 'none'
  openEntryMenu.value = null
}

function closeMenu() {
  openMenu.value = null
  groupMenuSection.value = 'none'
}

function toggleEntryMenu(id: number) {
  openEntryMenu.value = openEntryMenu.value === id ? null : id
  entryMenuSection.value = 'none'
  openMenu.value = null
}

function closeEntryMenu() {
  openEntryMenu.value = null
  entryMenuSection.value = 'none'
}

function toggleEntrySection(section: 'single-assign' | 'bulk-assign') {
  entryMenuSection.value = entryMenuSection.value === section ? 'none' : section
}

type BadgeVariant = 'warning' | 'primary' | 'success' | 'danger' | 'neutral'

function statusVariant(value: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    completed: 'success',
    pending_approval: 'primary',
    cancelled: 'danger',
    awaiting_answer: 'warning',
  }
  return map[value] ?? 'neutral'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.request-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.request-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.request-table__group {
  border-radius: var(--radius-lg);
  background: var(--color-white);
  position: relative;
}

.request-table__header {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  transition: background 0.1s;
}

.request-table__header--closed {
  border-radius: var(--radius-lg);
}

.request-table__header--selected {
  background: var(--color-primary-subtle);
}

.request-table__col {
  display: flex;
  align-items: center;
}

.request-table__col--check {
  width: 32px;
  flex-shrink: 0;
  justify-content: center;
}

.request-table__col--supplier {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.request-table__col--date {
  width: 110px;
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.request-table__col--assigned {
  width: 120px;
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.request-table__col--status {
  width: 130px;
  flex-shrink: 0;
}

.request-table__col--action {
  width: 36px;
  flex-shrink: 0;
  justify-content: center;
}

.request-table__supplier-link {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
}

.request-table__chevron {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.request-table__chevron:hover {
  color: var(--color-text);
}

.request-table__title {
  flex: 1;
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.request-table__title:hover {
  color: var(--color-primary);
}

/* Progress */
.request-table__progress {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  margin-left: auto;
}

/* More button */
.request-table__more-wrapper {
  position: relative;
  flex-shrink: 0;
}

.request-table__more-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}

.request-table__more-btn:hover,
.request-table__more-btn.is-active {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

/* More panel */
.request-table__more-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 220px;
  overflow: hidden;
}

.request-table__more-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  cursor: default;
  color: var(--color-text);
}

.request-table__more-item--info {
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-xs);
}

.request-table__more-item--section {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.request-table__more-item--danger {
  cursor: pointer;
  color: var(--color-danger);
  border-top: 1px solid var(--color-border);
  transition: background 0.1s;
}

.request-table__more-item--danger:hover {
  background: var(--color-danger-subtle);
}

.request-table__more-item--link {
  text-decoration: none;
  cursor: pointer;
  transition: background 0.1s;
}

.request-table__more-item--link:hover {
  background: var(--color-surface-hover);
}

.request-table__more-item--expandable {
  cursor: pointer;
  transition: background 0.1s;
}

.request-table__more-item--expandable:hover {
  background: var(--color-surface-hover);
}

.request-table__more-chevron {
  margin-left: auto;
  font-size: 16px !important;
}

.request-table__more-item--selected-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  cursor: default;
}

.request-table__clear-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
  cursor: pointer;
  transition: background 0.1s;
}

.request-table__clear-btn:hover {
  background: var(--color-surface-hover);
}

/* Assignee list */
.request-table__assignee-list {
  max-height: 180px;
  overflow-y: auto;
  border-bottom: 1px solid var(--color-border);
}

.request-table__assignee-loading {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.request-table__assignee-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  color: var(--color-text);
}

.request-table__assignee-option:hover {
  background: var(--color-surface-hover);
}

.request-table__assignee-option.is-selected {
  color: var(--color-primary);
}

.request-table__assignee-check {
  margin-left: auto;
  font-size: 16px;
}

/* Entries sub-table */
.request-table__entries {
  border-top: 1px solid var(--color-border);
}

.request-table__form-group:last-child .request-table__entry:last-child {
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}


.request-table__entries-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.request-table__entries-header .request-table__col {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
}

.request-table__entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
  font-size: var(--text-sm);
}

.request-table__entry:last-child {
  border-bottom: none;
}

.request-table__entry:hover {
  background: var(--color-surface-hover);
}

.request-table__entry--selected {
  background: var(--color-primary-subtle);
}

/* ── Mobile layout (< 768px) ── */
@media (max-width: 767px) {

  /* Group header → 2-row grid */
  .request-table__header {
    display: grid;
    grid-template-areas:
      "check chevron title more"
      ".     .       prog  .   ";
    grid-template-columns: 32px 28px 1fr 36px;
    gap: 2px var(--space-2);
    padding: var(--space-3);
  }

  .request-table__col--check {
    grid-area: check;
    width: auto;
  }

  .request-table__chevron {
    grid-area: chevron;
  }

  .request-table__title {
    grid-area: title;
  }

  .request-table__progress {
    grid-area: prog;
    margin-left: 0;
    color: var(--color-primary);
    font-weight: 500;
    font-size: var(--text-xs);
  }

  .request-table__header>.request-table__more-wrapper {
    grid-area: more;
  }

  /* Entries: hide column header, switch to card grid */
  .request-table__entries-header {
    display: none;
  }

  .request-table__entry {
    display: grid;
    grid-template-areas:
      "check supplier action"
      ".     assigned status ";
    grid-template-columns: 32px 1fr 36px;
    gap: var(--space-1) var(--space-2);
    padding: var(--space-3);
    align-items: center;
  }

  .request-table__entry .request-table__col--check {
    grid-area: check;
    width: auto;
  }

  .request-table__entry .request-table__col--supplier {
    grid-area: supplier;
    width: auto;
    min-width: 0;
  }

  .request-table__entry .request-table__col--date {
    display: none;
  }

  .request-table__entry .request-table__col--assigned {
    grid-area: assigned;
    width: auto;
    font-size: var(--text-xs);
  }

  .request-table__entry .request-table__col--status {
    grid-area: status;
    width: auto;
    justify-content: flex-end;
  }

  .request-table__entry .request-table__col--action {
    grid-area: action;
    width: auto;
  }
}
</style>
