<template>
  <div ref="rootRef" class="app-select">
    <button type="button" class="app-select__btn" :class="{ 'is-open': open }" @click="open = !open">
      {{ selectedLabel }}
      <span class="material-icons-round app-select__chevron">{{ open ? 'expand_less' : 'expand_more' }}</span>
    </button>
    <div v-if="open" class="app-select__panel">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="app-select__option"
        :class="{ 'is-active': modelValue === opt.value }"
        @click="$emit('update:modelValue', opt.value); open = false"
      >
        <span v-if="modelValue === opt.value" class="material-icons-round app-select__check">check</span>
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number
  options: { value: string | number; label: string }[]
}>()

defineEmits<{ 'update:modelValue': [value: string | number] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
onClickOutside(rootRef, () => { open.value = false })

const selectedLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? String(props.modelValue),
)
</script>

<style scoped>
.app-select {
  position: relative;
  display: inline-block;
}

.app-select__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-base);
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
  min-width: 110px;
  justify-content: space-between;
}

.app-select__btn:hover,
.app-select__btn.is-open {
  border-color: var(--color-primary);
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
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
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
}

.app-select__option:hover { background: var(--color-surface-hover); }
.app-select__option.is-active { color: var(--color-primary); font-weight: 500; }

.app-select__check {
  position: absolute;
  left: 8px;
  font-size: 16px !important;
  color: var(--color-primary);
}
</style>
