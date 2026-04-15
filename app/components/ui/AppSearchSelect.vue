<template>
  <div ref="rootRef" class="app-select">
    <button type="button" class="app-select__btn" :class="{ 'is-open': open }" @click="toggle">
      <span :class="{ 'app-select__placeholder': !selectedLabel }">{{ selectedLabel || placeholder }}</span>
      <span class="material-icons-round app-select__chevron">{{ open ? 'expand_less' : 'expand_more' }}</span>
    </button>
    <div v-if="open" class="app-select__panel">
      <div v-if="searchable" class="app-select__search-wrap">
        <span class="material-icons-round app-select__search-icon">search</span>
        <input
          ref="searchRef"
          v-model="query"
          type="text"
          class="app-select__search"
          placeholder="Search..."
          @click.stop
          @keydown.stop
        />
      </div>
      <template v-if="filtered.length">
        <button
          v-for="opt in filtered"
          :key="opt.value"
          type="button"
          class="app-select__option"
          :class="{ 'is-active': modelValue === opt.value }"
          @click="select(opt.value)"
        >
          <span v-if="modelValue === opt.value" class="material-icons-round app-select__check">check</span>
          {{ opt.label }}
        </button>
      </template>
      <p v-else class="app-select__empty">No results</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string | number
  options: { value: string | number; label: string }[]
  placeholder?: string
  searchable?: boolean
}>(), {
  searchable: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const open = ref(false)
const query = ref('')
const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

onClickOutside(rootRef, () => { open.value = false; query.value = '' })

function toggle() {
  open.value = !open.value
  if (open.value) {
    query.value = ''
    if (props.searchable) nextTick(() => searchRef.value?.focus())
  }
}

function select(value: string | number) {
  emit('update:modelValue', value)
  open.value = false
  query.value = ''
}

const selectedLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? '',
)

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/base/variables' as *;

.app-select {
  position: relative;
  display: block;
  width: 100%;
}

.app-select__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 40px;
  padding: 0 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-base);
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
  justify-content: space-between;

  @media (min-width: 1280px) {
    height: 44px;
  }
}

.app-select__btn:hover,
.app-select__btn.is-open {
  border-color: var(--color-primary);
}

.app-select__placeholder {
  color: var(--color-text-muted);
}

.app-select__chevron { font-size: 18px !important; color: var(--color-text-muted); }

.app-select__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 100%;
  max-height: 260px;
  overflow-y: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
}

.app-select__search-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-surface);
  z-index: 1;
}

.app-select__search-icon {
  font-size: 18px !important;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.app-select__search {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: var(--text-sm);
  font-family: var(--font-base);
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
  }
}

.app-select__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 8px var(--space-3);
  padding-left: 32px;
  font-size: var(--text-sm);
  font-family: var(--font-base);
  color: var(--color-text);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
}

.app-select__option:hover { background: var(--color-surface-hover); }
.app-select__option.is-active { color: var(--color-primary); font-weight: 500; }

.app-select__check {
  position: absolute;
  left: 8px;
  font-size: 16px !important;
  color: var(--color-primary);
}

.app-select__empty {
  padding: var(--space-4) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
