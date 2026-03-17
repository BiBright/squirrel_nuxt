<template>
  <div class="app-table-wrapper">
    <table class="app-table">
      <thead class="app-table__head">
        <tr>
          <th class="app-table__th app-table__th--check">
            <input type="checkbox" :checked="allSelected" @change="toggleAll" />
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            class="app-table__th"
            :class="{ 'app-table__th--primary': col.primary }"
          >
            {{ col.label }}
          </th>
          <th v-if="buttonDelete" class="app-table__th app-table__th--action" />
          <th v-if="dropDownActions.length" :colspan="dropDownActions.length" class="app-table__th app-table__th--action" />
        </tr>
      </thead>

      <tbody>
        <template v-for="(row, rowIdx) in rows" :key="rowIdx">
          <tr
            class="app-table__row"
            :class="{
              'app-table__row--selected': selected.includes(rowIdx),
              'app-table__row--open': openPanel !== null && openPanel.rowIdx === rowIdx,
            }"
          >
            <td class="app-table__td app-table__td--check">
              <input type="checkbox" :checked="selected.includes(rowIdx)" @change="toggleSelect(rowIdx)" />
            </td>

            <td
              v-for="col in columns"
              :key="col.key"
              class="app-table__td"
              :class="{ 'app-table__td--primary': col.primary }"
            >
              <slot :name="`cell-${col.key}`" :value="row[col.key]" :row="row">
                <span class="app-table__cell-text">{{ row[col.key] ?? '—' }}</span>
              </slot>
            </td>

            <td v-if="buttonDelete" class="app-table__td app-table__td--action">
              <button class="app-table__action-btn app-table__action-btn--danger" title="Delete" @click="emit('delete', row, rowIdx)">
                <span class="material-icons-round">delete</span>
              </button>
            </td>

            <td
              v-for="action in dropDownActions"
              :key="action.key"
              class="app-table__td app-table__td--action"
            >
              <button
                class="app-table__action-btn"
                :class="{ 'is-active': openPanel?.rowIdx === rowIdx && openPanel?.key === action.key }"
                :title="action.label ?? 'More'"
                @click="togglePanel(rowIdx, action.key)"
              >
                <span class="material-icons-round">{{ action.icon ?? 'more_horiz' }}</span>
              </button>
            </td>
          </tr>

          <!-- Dropdown panel -->
          <tr
            v-if="openPanel !== null && openPanel.rowIdx === rowIdx"
            class="app-table__dropdown-row"
          >
            <td :colspan="totalCols" class="app-table__dropdown-cell">
              <div class="app-table__dropdown-panel">
                <slot :name="`dropdown-${openPanel.key}`" :row="row" :close="closePanel" />
              </div>
            </td>
          </tr>
        </template>

        <tr v-if="rows.length === 0">
          <td :colspan="totalCols" class="app-table__empty">
            <slot name="empty">No data to display.</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  primary?: boolean
}

interface DropDownAction {
  key: string
  icon?: string
  label?: string
}

const props = defineProps<{
  columns: Column[]
  rows: Record<string, unknown>[]
  buttonDelete?: boolean
  dropDown?: boolean | DropDownAction[]
}>()

const emit = defineEmits<{
  delete: [row: Record<string, unknown>, index: number]
  select: [indices: number[]]
}>()

const dropDownActions = computed<DropDownAction[]>(() => {
  if (!props.dropDown) return []
  if (props.dropDown === true) return [{ key: 'default', icon: 'more_horiz' }]
  return props.dropDown
})

const selected = ref<number[]>([])
const openPanel = ref<{ rowIdx: number, key: string } | null>(null)

const totalCols = computed(() => {
  let count = 1 + props.columns.length
  if (props.buttonDelete) count++
  count += dropDownActions.value.length
  return count
})

const allSelected = computed(() =>
  props.rows.length > 0 && props.rows.every((_, i) => selected.value.includes(i)),
)

function toggleSelect(idx: number) {
  const i = selected.value.indexOf(idx)
  i === -1 ? selected.value.push(idx) : selected.value.splice(i, 1)
  emit('select', selected.value)
}

function toggleAll() {
  allSelected.value ? (selected.value = []) : (selected.value = props.rows.map((_, i) => i))
  emit('select', selected.value)
}

function togglePanel(rowIdx: number, key: string) {
  if (openPanel.value?.rowIdx === rowIdx && openPanel.value?.key === key) {
    openPanel.value = null
  }
  else {
    openPanel.value = { rowIdx, key }
  }
}

function closePanel() {
  openPanel.value = null
}
</script>

<style scoped>
.app-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

/* Head */
.app-table__head {
  border-bottom: 1px solid var(--color-border);
}

.app-table__th {
  padding: var(--space-2) var(--space-4);
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.app-table__th--primary {
  min-width: 220px;
}

.app-table__th--check,
.app-table__th--action {
  width: 40px;
  text-align: center;
}

/* Rows */
.app-table__row {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
}

.app-table__row:last-child {
  border-bottom: none;
}

.app-table__row:hover {
  background: var(--color-surface-hover);
}

.app-table__row--selected {
  background: var(--color-primary-subtle);
}

.app-table__row--open {
  background: var(--color-surface-hover);
}

/* Cells */
.app-table__td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-muted);
  vertical-align: middle;
}

.app-table__td--check,
.app-table__td--action {
  text-align: center;
  width: 40px;
}

.app-table__td--primary {
  color: var(--color-primary);
  font-weight: 500;
  min-width: 220px;
}

.app-table__cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.app-table__td--primary .app-table__cell-text {
  max-width: 260px;
  color: var(--color-primary);
}

/* Action buttons */
.app-table__action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.app-table__action-btn:hover,
.app-table__action-btn.is-active {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.app-table__action-btn--danger:hover {
  color: var(--color-danger);
  background: var(--color-danger-subtle);
}

/* Dropdown panel */
.app-table__dropdown-row {
  background: var(--color-surface-raised);
}

.app-table__dropdown-cell {
  padding: 0;
  border-bottom: 1px solid var(--color-border);
}

.app-table__dropdown-panel {
  padding: var(--space-4) var(--space-6);
}

/* Empty state */
.app-table__empty {
  padding: var(--space-10) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
}
</style>
