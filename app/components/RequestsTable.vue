<template>
  <div class="rt">
    <!-- Empty state -->
    <div v-if="requests.length === 0" class="rt__empty">
      <span class="material-icons-round">inbox</span>
      <p>No requests found.</p>
    </div>

    <!-- Groups -->
    <div v-for="req in requests" :key="req.id" class="rt__group">

      <!-- Group header -->
      <div class="rt__header" :class="{ 'rt__header--selected': isGroupSelected(req) }">

        <!-- Checkbox -->
        <div class="rt__col rt__col--check">
          <input
            type="checkbox"
            :checked="isGroupSelected(req)"
            :indeterminate="isGroupIndeterminate(req)"
            @change="toggleGroup(req)"
          />
        </div>

        <!-- Chevron -->
        <button class="rt__chevron" @click="toggleExpand(req.id)">
          <span class="material-icons-round">
            {{ expanded.has(req.id) ? 'expand_less' : 'expand_more' }}
          </span>
        </button>

        <!-- Title -->
        <NuxtLink :to="`/requests/${req.id}/edit`" class="rt__title">
          {{ displayTitle(req) }}
        </NuxtLink>

        <!-- Progress -->
        <span class="rt__progress">
          {{ totalCompleted(req) }}/{{ totalEntries(req) }}
        </span>

        <!-- More button -->
        <div class="rt__more-wrapper">
          <button
            class="rt__more-btn"
            :class="{ 'is-active': openMenu === req.id }"
            @click.stop="toggleMenu(req.id)"
          >
            <span class="material-icons-round">more_horiz</span>
          </button>

          <!-- More panel -->
          <div v-if="openMenu === req.id" v-click-outside="closeMenu" class="rt__more-panel">

            <!-- 1. Selected count -->
            <div class="rt__more-item rt__more-item--info">
              <span class="material-icons-round">check_box</span>
              {{ selectedInGroup(req).length }} supplier{{ selectedInGroup(req).length !== 1 ? 's' : '' }} selected
            </div>

            <!-- 2. Assignee -->
            <div class="rt__more-item rt__more-item--section">
              <span class="material-icons-round">person</span>
              <span>Assign to</span>
            </div>
            <div class="rt__assignee-list">
              <div v-if="loadingUsers" class="rt__assignee-loading">Loading users...</div>
              <button
                v-for="user in users"
                :key="user.id"
                class="rt__assignee-option"
                :class="{ 'is-selected': req.assigned_to?.id === user.id }"
                @click="emit('assign', req, user)"
              >
                <span class="material-icons-round">person_outline</span>
                {{ user.name }}
                <span v-if="req.assigned_to?.id === user.id" class="material-icons-round rt__assignee-check">check</span>
              </button>
            </div>

            <!-- 3. Remove -->
            <button class="rt__more-item rt__more-item--danger" @click="emit('remove', req); closeMenu()">
              <span class="material-icons-round">delete</span>
              Remove request
            </button>

          </div>
        </div>
      </div>

      <!-- Entries sub-table -->
      <div v-if="expanded.has(req.id)" class="rt__entries">
        <div class="rt__entries-header">
          <div class="rt__col rt__col--check">Select</div>
          <div class="rt__col rt__col--supplier">Supplier</div>
          <div class="rt__col rt__col--date">Created at</div>
          <div class="rt__col rt__col--date">Updated at</div>
          <div class="rt__col rt__col--assigned">Assigned to</div>
          <div class="rt__col rt__col--status">Status</div>
          <div class="rt__col rt__col--action">More</div>
        </div>

        <div v-for="form in req.forms" :key="form.form_id" class="rt__form-group">
          <div
            v-for="entry in form.suppliers"
            :key="entry.id"
            class="rt__entry"
            :class="{ 'rt__entry--selected': selectedEntries.has(entry.id) }"
          >
            <div class="rt__col rt__col--check">
              <input
                type="checkbox"
                :checked="selectedEntries.has(entry.id)"
                @change="toggleEntry(entry.id)"
              />
            </div>
            <div class="rt__col rt__col--supplier">
              <NuxtLink :to="`/suppliers/${entry.supplier.id}`" class="rt__supplier-link">{{ entry.supplier.name }}</NuxtLink>
            </div>
            <div class="rt__col rt__col--date">{{ formatDate(entry.created_at) }}</div>
            <div class="rt__col rt__col--date">{{ formatDate(entry.updated_at) }}</div>
            <div class="rt__col rt__col--assigned">{{ req.assigned_to?.name ?? '—' }}</div>
            <div class="rt__col rt__col--status">
              <AppBadge :variant="statusVariant(entry.status.value)">
                {{ entry.status.label }}
              </AppBadge>
            </div>

            <!-- Entry more button -->
            <div class="rt__col rt__col--action">
              <div class="rt__more-wrapper">
                <button
                  class="rt__more-btn"
                  :class="{ 'is-active': openEntryMenu === entry.id }"
                  @click.stop="toggleEntryMenu(entry.id)"
                >
                  <span class="material-icons-round">more_horiz</span>
                </button>

                <div v-if="openEntryMenu === entry.id" v-click-outside="closeEntryMenu" class="rt__more-panel rt__more-panel--entry">

                  <!-- ── MULTI-SELECT: this entry is selected with others ── -->
                  <template v-if="selectedEntries.has(entry.id) && selectedEntries.size > 1">

                    <div class="rt__more-item rt__more-item--section">Selected Requests</div>

                    <div class="rt__more-item rt__more-item--selected-count">
                      <AppBadge variant="neutral">{{ selectedEntries.size }} Selected</AppBadge>
                      <button class="rt__clear-btn" @click="clearSelection">
                        Clear <span class="material-icons-round" style="font-size:12px;vertical-align:middle">close</span>
                      </button>
                    </div>

                    <button class="rt__more-item rt__more-item--expandable" @click="toggleEntrySection('bulk-assign')">
                      <span class="material-icons-round">person</span>
                      Assignee User
                      <span class="material-icons-round rt__more-chevron">{{ entryMenuSection === 'bulk-assign' ? 'expand_less' : 'expand_more' }}</span>
                    </button>
                    <div v-if="entryMenuSection === 'bulk-assign'" class="rt__assignee-list">
                      <div v-if="loadingUsers" class="rt__assignee-loading">Loading users...</div>
                      <button
                        v-for="user in users"
                        :key="user.id"
                        class="rt__assignee-option"
                        @click="emit('bulkAssign', [...selectedEntries], user); closeEntryMenu()"
                      >
                        <span class="material-icons-round">person_outline</span>
                        {{ user.name }}
                      </button>
                    </div>

                    <button class="rt__more-item rt__more-item--danger" @click="emit('bulkRemove', [...selectedEntries]); closeEntryMenu()">
                      <span class="material-icons-round">delete</span>
                      Remove requests
                    </button>

                    <div class="rt__more-item rt__more-item--section" style="border-top: 1px solid var(--color-border); margin-top: 2px;">This Request</div>
                  </template>

                  <!-- ── SINGLE / THIS REQUEST actions ── -->
                  <NuxtLink :to="`/requests/${req.id}/edit`" class="rt__more-item rt__more-item--link" @click="closeEntryMenu()">
                    <span class="material-icons-round">edit</span>
                    Edit Request
                  </NuxtLink>

                  <button class="rt__more-item rt__more-item--expandable" @click="toggleEntrySection('single-assign')">
                    <span class="material-icons-round">person</span>
                    Assignee User
                    <span class="material-icons-round rt__more-chevron">{{ entryMenuSection === 'single-assign' ? 'expand_less' : 'expand_more' }}</span>
                  </button>
                  <div v-if="entryMenuSection === 'single-assign'" class="rt__assignee-list">
                    <div v-if="loadingUsers" class="rt__assignee-loading">Loading users...</div>
                    <button
                      v-for="user in users"
                      :key="user.id"
                      class="rt__assignee-option"
                      :class="{ 'is-selected': req.assigned_to?.id === user.id }"
                      @click="emit('assign', req, user); closeEntryMenu()"
                    >
                      <span class="material-icons-round">person_outline</span>
                      {{ user.name }}
                      <span v-if="req.assigned_to?.id === user.id" class="material-icons-round rt__assignee-check">check</span>
                    </button>
                  </div>

                  <button class="rt__more-item rt__more-item--danger" @click="emit('remove', req); closeEntryMenu()">
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

const expanded = ref<Set<number>>(new Set())
const selectedEntries = ref<Set<number>>(new Set())
const openMenu = ref<number | null>(null)
const openEntryMenu = ref<number | null>(null)
const entryMenuSection = ref<'none' | 'single-assign' | 'bulk-assign'>('none')

// ── Helpers ──────────────────────────────────────────────────────────

function allEntries(req: Request): RequestEntry[] {
  return req.forms.flatMap(f => f.suppliers)
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

function selectedInGroup(req: Request): number[] {
  return allEntries(req)
    .map(e => e.id)
    .filter(id => selectedEntries.value.has(id))
}

function isGroupSelected(req: Request): boolean {
  const entries = allEntries(req)
  return entries.length > 0 && entries.every(e => selectedEntries.value.has(e.id))
}

function isGroupIndeterminate(req: Request): boolean {
  const entries = allEntries(req)
  const sel = entries.filter(e => selectedEntries.value.has(e.id))
  return sel.length > 0 && sel.length < entries.length
}

function toggleGroup(req: Request) {
  const entries = allEntries(req)
  if (isGroupSelected(req)) {
    entries.forEach(e => selectedEntries.value.delete(e.id))
  }
  else {
    entries.forEach(e => selectedEntries.value.add(e.id))
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

function toggleExpand(id: number) {
  expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id)
}

function toggleMenu(id: number) {
  openMenu.value = openMenu.value === id ? null : id
  openEntryMenu.value = null
}

function closeMenu() {
  openMenu.value = null
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
.rt {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.rt__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

/* Group */
.rt__group {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  position: relative;
}

.rt__group > .rt__header:first-child {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.rt__group > *:last-child {
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

/* Group header */
.rt__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-raised);
  transition: background 0.1s;
}

.rt__header--selected {
  background: var(--color-primary-subtle);
}

/* Columns */
.rt__col { display: flex; align-items: center; }
.rt__col--check   { width: 32px; flex-shrink: 0; justify-content: center; }
.rt__col--supplier { flex: 1; min-width: 160px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.rt__col--date    { width: 110px; flex-shrink: 0; font-size: var(--text-xs); color: var(--color-text-muted); }
.rt__col--assigned { width: 120px; flex-shrink: 0; font-size: var(--text-xs); color: var(--color-text-muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.rt__col--status  { width: 130px; flex-shrink: 0; }
.rt__col--action  { width: 36px; flex-shrink: 0; justify-content: center; }

/* Supplier link */
.rt__supplier-link { color: var(--color-primary); font-weight: 500; text-decoration: none; }
.rt__supplier-link:hover { text-decoration: underline; }

/* Chevron */
.rt__chevron {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.rt__chevron:hover { color: var(--color-text); }

/* Title */
.rt__title {
  flex: 1;
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rt__title:hover { color: var(--color-primary); }

/* Progress */
.rt__progress {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  margin-left: auto;
}

/* More button */
.rt__more-wrapper {
  position: relative;
  flex-shrink: 0;
}

.rt__more-btn {
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

.rt__more-btn:hover,
.rt__more-btn.is-active {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

/* More panel */
.rt__more-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 220px;
  overflow: hidden;
}

.rt__more-item {
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

.rt__more-item--info {
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-xs);
}

.rt__more-item--section {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.rt__more-item--danger {
  cursor: pointer;
  color: var(--color-danger);
  border-top: 1px solid var(--color-border);
  transition: background 0.1s;
}

.rt__more-item--danger:hover { background: var(--color-danger-subtle); }

.rt__more-item--link {
  text-decoration: none;
  cursor: pointer;
  transition: background 0.1s;
}

.rt__more-item--link:hover { background: var(--color-surface-hover); }

.rt__more-item--expandable {
  cursor: pointer;
  transition: background 0.1s;
}

.rt__more-item--expandable:hover { background: var(--color-surface-hover); }

.rt__more-chevron { margin-left: auto; font-size: 16px !important; }

.rt__more-item--selected-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  cursor: default;
}

.rt__clear-btn {
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

.rt__clear-btn:hover { background: var(--color-surface-hover); }

/* Assignee list */
.rt__assignee-list {
  max-height: 180px;
  overflow-y: auto;
  border-bottom: 1px solid var(--color-border);
}

.rt__assignee-loading {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.rt__assignee-option {
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

.rt__assignee-option:hover { background: var(--color-surface-hover); }

.rt__assignee-option.is-selected { color: var(--color-primary); }

.rt__assignee-check { margin-left: auto; font-size: 16px; }

/* Entries sub-table */
.rt__entries {
  border-top: 1px solid var(--color-border);
}

.rt__form-group {}

.rt__entries-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.rt__entries-header .rt__col {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rt__entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
  font-size: var(--text-sm);
}

.rt__entry:last-child { border-bottom: none; }
.rt__entry:hover { background: var(--color-surface-hover); }

.rt__entry--selected { background: var(--color-primary-subtle); }
</style>
