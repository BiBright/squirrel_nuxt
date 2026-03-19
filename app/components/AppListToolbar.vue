<template>
  <div class="list-toolbar">
    <div class="list-toolbar__search">
      <input
        type="text"
        class="input-search"
        :placeholder="`Search ${label}s...`"
        :value="search"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="list-toolbar__sort">
      <div ref="sortRef" class="sort-dropdown">
        <button class="sort-dropdown__btn" :class="{ 'is-open': sortOpen }" @click="sortOpen = !sortOpen">
          <span class="material-icons-round">sort</span>
          {{ sortLabel }}
          <span class="material-icons-round sort-dropdown__chevron">{{ sortOpen ? 'expand_less' : 'expand_more' }}</span>
        </button>
        <div v-if="sortOpen" class="sort-dropdown__panel">
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            class="sort-dropdown__option"
            :class="{ 'is-active': sort === opt.value }"
            @click="$emit('update:sort', opt.value); sortOpen = false"
          >
            <span v-if="sort === opt.value" class="material-icons-round sort-dropdown__check">check</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="!hideViewToggle" class="list-toolbar__view-toggle">
        <button
          class="btn-view"
          :data-active="view === 'list'"
          title="List view"
          @click="$emit('update:view', 'list')"
        >
          <span class="material-icons-round icon">view_list</span>
        </button>
        <button
          class="btn-view"
          :data-active="view === 'grid'"
          title="Mosaic view"
          @click="$emit('update:view', 'grid')"
        >
          <span class="material-icons-round icon">grid_view</span>
        </button>
      </div>
    </div>

    <div class="list-toolbar__actions">
      <!-- <span v-if="totalCount !== undefined" class="list-toolbar__count body01 text-muted">
        {{ totalCount }} {{ label }}{{ totalCount !== 1 ? 's' : '' }}
      </span> -->
    </div>

    <template v-if="selectedCount && selectedCount > 0">
      <slot name="bulk-actions" />
      <AppButton variant="danger" icon="delete" @click="$emit('delete')">
        Delete ({{ selectedCount }})
      </AppButton>
    </template>

    <AppButton icon="add" @click="$emit('add')">{{ addLabel }}</AppButton>
  </div>
</template>

<script setup lang="ts">
const sortOpen = ref(false)
const sortRef = ref<HTMLElement | null>(null)
onClickOutside(sortRef, () => { sortOpen.value = false })

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az',     label: 'A to Z' },
  { value: 'za',     label: 'Z to A' },
]

const props = withDefaults(defineProps<{
  search: string
  sort: string
  view: 'list' | 'grid'
  label?: string
  addLabel?: string
  totalCount?: number
  selectedCount?: number
  hideViewToggle?: boolean
}>(), {
  label: 'item',
  addLabel: 'Add',
  hideViewToggle: false,
})

defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: string]
  'update:view': [value: 'list' | 'grid']
  'add': []
  'delete': []
}>()

const sortLabel = computed(() => sortOptions.find(o => o.value === props.sort)?.label ?? 'Sort')
</script>

<style scoped>
.sort-dropdown {
  position: relative;
}

.sort-dropdown__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: 44px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;
  min-width: 160px;

  .material-icons-round { font-size: 18px; color: var(--color-text-muted); }
}

.sort-dropdown__btn:hover,
.sort-dropdown__btn.is-open {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.sort-dropdown__chevron { flex-shrink: 0; }

.sort-dropdown__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  overflow: hidden;
}

.sort-dropdown__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px var(--space-3);
  padding-left: 36px;
  font-size: var(--text-sm);
  color: var(--color-text);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  position: relative;
}

.sort-dropdown__option:hover { background: var(--color-surface-hover); }

.sort-dropdown__option.is-active { color: var(--color-primary); font-weight: 500; }

.sort-dropdown__check {
  position: absolute;
  left: 10px;
  font-size: 16px !important;
  color: var(--color-primary);
}
</style>
