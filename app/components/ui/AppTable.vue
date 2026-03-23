<template>
  <div class="app-table-wrapper">
    <table class="app-table">
      <thead class="app-table__head">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="app-table__th"
            :class="{ 'app-table__th--primary': col.primary }"
          >
            {{ col.label }}
          </th>
          <th v-if="buttonEdit" class="app-table__th app-table__th--action" />
          <th v-if="buttonDelete" class="app-table__th app-table__th--action" />
          <th v-if="dropDownActions.length" :colspan="dropDownActions.length" class="app-table__th app-table__th--action" />
        </tr>
      </thead>

      <tbody>
        <template v-for="(row, rowIdx) in rows" :key="rowIdx">
          <tr
            class="app-table__row"
            :class="{ 'app-table__row--open': openPanel !== null && openPanel.rowIdx === rowIdx }"
          >
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

            <td v-if="buttonEdit" class="app-table__td app-table__td--action">
              <button class="app-table__action-btn app-table__action-btn--edit" title="Edit" @click="emit('edit', row, rowIdx)">
                <span class="material-icons-round">edit</span>
              </button>
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
  buttonEdit?: boolean
  buttonDelete?: boolean
  dropDown?: boolean | DropDownAction[]
}>()

const emit = defineEmits<{
  edit: [row: Record<string, unknown>, index: number]
  delete: [row: Record<string, unknown>, index: number]
}>()

const dropDownActions = computed<DropDownAction[]>(() => {
  if (!props.dropDown) return []
  if (props.dropDown === true) return [{ key: 'default', icon: 'more_horiz' }]
  return props.dropDown
})

const openPanel = ref<{ rowIdx: number, key: string } | null>(null)

const totalCols = computed(() => {
  let count = props.columns.length
  if (props.buttonEdit) count++
  if (props.buttonDelete) count++
  count += dropDownActions.value.length
  return count
})

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
  background: var(--color-surface);
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

/* Head */

.app-table__head {
  position: relative;
}

.app-table__head::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background-color: var(--color-black20);
}

.app-table__th {
  padding: 24px 0 16px;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.app-table__th:first-child { padding-left: 48px; }
.app-table__th:last-child { padding-right: 32px; }

.app-table__th--primary {
  min-width: 220px;
}

.app-table__th--action {
  width: 40px;
  text-align: center;
}

.app-table__row {
  transition: background 0.1s;
}

.app-table__row:last-child {
  border-bottom: none;
}

.app-table__row:hover {
  background: var(--color-primary-25);
}

.app-table__row--open {
  background: var(--color-surface-hover);
}

/* Cells */
.app-table__td {
  padding: 24px 0 16px;
  color: var(--color-text-muted);
  vertical-align: middle;
}

.app-table__td:first-child { padding-left: 48px; }
.app-table__td:last-child { padding-right: 32px; }

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

.app-table__action-btn--edit .material-icons-round {
  color: var(--color-primary);
  font-size: 20px;
}

.app-table__action-btn--danger .material-icons-round {
  color: var(--color-black60);
  font-size: 20px;
}

/* Dropdown panel */
.app-table__dropdown-row {
  background: var(--color-surface-raised);
}

.app-table__dropdown-cell {
  padding: 0;
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
