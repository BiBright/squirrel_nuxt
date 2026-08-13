<template>
  <div class="list-toolbar">
    <div class="list-toolbar__search">
      <div class="input-search-wrap">
        <span class="material-icons-round input-search-wrap__icon">search</span>
        <input type="text" class="input-search" :placeholder="`Search ${label}s...`" :value="search"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)" />
      </div>
    </div>

    <div class="list-toolbar__sort">
      <div ref="sortRef" class="sort-dropdown">
        <button class="sort-dropdown__btn" :class="{ 'is-open': sortOpen }" @click="sortOpen = !sortOpen">
          <span class="material-icons-round">sort</span>
          <span class="sort-dropdown__label">{{ sortLabel }}</span>
          <span class="material-icons-round sort-dropdown__chevron">{{ sortOpen ? 'expand_less' : 'expand_more' }}</span>
        </button>
        <div v-if="sortOpen" class="sort-dropdown__panel">
          <button v-for="opt in sortOptions" :key="opt.value" class="sort-dropdown__option"
            :class="{ 'is-active': sort === opt.value }" @click="$emit('update:sort', opt.value); sortOpen = false">
            <span v-if="sort === opt.value" class="material-icons-round sort-dropdown__check">check</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="!hideViewToggle" class="list-toolbar__view-toggle">
        <button class="btn-view" :data-active="view === 'list'" title="List view" @click="$emit('update:view', 'list')">
          <span class="material-icons-round icon">view_list</span>
        </button>
        <button class="btn-view" :data-active="view === 'grid'" title="Mosaic view"
          @click="$emit('update:view', 'grid')">
          <span class="material-icons-round icon">grid_view</span>
        </button>
      </div>
    </div>
    
    <AppButton v-if="isActive" class="list-toolbar__action-btn add-label-button" icon="add" @click="$emit('add')">{{ addLabel }}</AppButton>

    <div v-if="showToggle" class="list-toolbar__segmented" role="tablist" :aria-label="`${pluralLabel} status filter`">
      <button type="button" class="segmented__btn segmented__btn--active" :class="{ 'is-selected': isActive }"
        role="tab" :aria-selected="isActive" @click="$emit('update:isActive', true)">Active</button>
      <button type="button" class="segmented__btn segmented__btn--inactive" :class="{ 'is-selected': !isActive }"
        role="tab" :aria-selected="!isActive" @click="$emit('update:isActive', false)">Inactive</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const sortOpen = ref(false)
const sortRef = ref<HTMLElement | null>(null)
onClickOutside(sortRef, () => { sortOpen.value = false })

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
]

const props = withDefaults(defineProps<{
  search: string
  sort: string
  view: 'list' | 'grid'
  label?: string
  addLabel?: string
  hideViewToggle?: boolean
  showToggle?: boolean
  isActive?: boolean
}>(), {
  label: 'item',
  addLabel: 'Add',
  hideViewToggle: false,
  showToggle: false,
  isActive: true,
})

defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: string]
  'update:view': [value: 'list' | 'grid']
  'update:isActive': [value: boolean]
  'add': []
}>()

const sortLabel = computed(() => sortOptions.find(o => o.value === props.sort)?.label ?? 'Sort')
const pluralLabel = computed(() => `${props.label.charAt(0).toUpperCase()}${props.label.slice(1)}s`)
</script>

<style scoped lang="scss">
@use '~/assets/scss/base/variables' as *;

.sort-dropdown {
  position: relative;
}

.sort-dropdown__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 40px;
  min-width: 40px;
  height: 40px;
  padding: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;

  .material-icons-round {
    font-size: 18px;
    color: var(--color-text-muted);
  }

  @media (min-width: $bp-sm) {
    justify-content: space-between;
    width: auto;
    min-width: 160px;
    height: 44px;
    padding: 0 12px;
  }
}

.sort-dropdown__label,
.sort-dropdown__chevron {
  display: none;

  @media (min-width: $bp-sm) {
    display: inline;
  }
}

.sort-dropdown__btn:hover,
.sort-dropdown__btn.is-open {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.sort-dropdown__chevron {
  flex-shrink: 0;
}

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

.sort-dropdown__option:hover {
  background: var(--color-surface-hover);
}

.sort-dropdown__option.is-active {
  color: var(--color-primary);
  font-weight: 500;
}

.sort-dropdown__check {
  position: absolute;
  left: 10px;
  font-size: 16px !important;
  color: var(--color-primary);
}

.list-toolbar__action-btn {
  width: 100%;

  @media (min-width: $bp-sm) {
    width: auto;
  }
}

.add-label-button {
  @media (min-width: $bp-sm) {
    display: none;
  }
}

.list-toolbar__segmented {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--color-border);
  border-radius: var(--radius-md);
  margin-left: auto;
}

.segmented__btn {
  border: none;
  outline: none;
  background: none;
  cursor: pointer;
  padding: 6px 14px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  border-radius: calc(var(--radius-md) - 2px);
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;

  &:hover:not(.is-selected) { color: var(--color-text); }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.segmented__btn--active.is-selected {
  background: var(--color-primary);
  color: var(--color-white);
}

.segmented__btn--inactive.is-selected {
  background: var(--color-danger);
  color: var(--color-white);
}
</style>
