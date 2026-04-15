<template>
  <div class="app-phone-input">
    <div ref="prefixRef" class="app-phone-input__prefix">
      <button type="button" class="app-phone-input__code-btn" @click="toggle">
        <span>{{ code || '+--' }}</span>
        <span class="material-icons-round app-phone-input__chevron">expand_more</span>
      </button>
      <div v-if="open" class="app-phone-input__panel">
        <div class="app-phone-input__search-wrap">
          <span class="material-icons-round app-phone-input__search-icon">search</span>
          <input
            ref="searchRef"
            v-model="query"
            type="text"
            class="app-phone-input__search"
            placeholder="Search..."
            @click.stop
            @keydown.stop
            @keydown.down.prevent="moveFocus(0)"
            @keydown.up.prevent="moveFocus(filteredPrefixes.length - 1)"
          />
        </div>
        <template v-if="filteredPrefixes.length">
          <button
            v-for="(c, i) in filteredPrefixes"
            :key="`${c.phone_prefix}-${c.name}`"
            :ref="el => { if (el) optionRefs[i] = el as HTMLButtonElement }"
            type="button"
            class="app-phone-input__option"
            :class="{ 'is-focused': focusedIndex === i }"
            @click="selectPrefix(c.phone_prefix)"
            @keydown.down.prevent="moveFocus(i + 1)"
            @keydown.up.prevent="moveFocus(i - 1)"
            @keydown.enter.prevent="selectPrefix(c.phone_prefix)"
          >
            <span class="app-phone-input__option-name">{{ c.name }}</span>
            <span class="app-phone-input__option-prefix">{{ c.phone_prefix }}</span>
          </button>
        </template>
        <p v-else class="app-phone-input__empty">No results</p>
      </div>
    </div>

    <input
      :value="modelValue"
      type="text"
      class="input-text app-phone-input__number"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
interface Country {
  id: number
  name: string
  iso_code: string
  phone_prefix: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  code: string
  countries: Country[]
  placeholder?: string
}>(), {
  placeholder: 'Phone number',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:code': [value: string]
}>()

const open = ref(false)
const query = ref('')
const focusedIndex = ref(-1)
const prefixRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const optionRefs = ref<HTMLButtonElement[]>([])

function handleOutsideMousedown(e: MouseEvent) {
  if (prefixRef.value && !prefixRef.value.contains(e.target as Node)) {
    open.value = false
    query.value = ''
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideMousedown))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideMousedown))

watch(() => open.value, (val) => {
  if (!val) focusedIndex.value = -1
})

watch(query, () => {
  focusedIndex.value = -1
  optionRefs.value = []
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    query.value = ''
    focusedIndex.value = -1
    nextTick(() => searchRef.value?.focus())
  }
}

function moveFocus(index: number) {
  const len = filteredPrefixes.value.length
  if (!len) return
  focusedIndex.value = (index + len) % len
  nextTick(() => optionRefs.value[focusedIndex.value]?.focus())
}

function selectPrefix(phoneCode: string) {
  emit('update:code', phoneCode)
  open.value = false
  query.value = ''
}

const filteredPrefixes = computed(() => {
  if (!query.value) return props.countries
  const q = query.value.toLowerCase()
  return props.countries.filter(
    c => c.name.toLowerCase().includes(q) || (c.phone_prefix ?? '').includes(q),
  )
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/base/variables' as *;

.app-phone-input {
  display: flex;
}

.app-phone-input__prefix {
  position: relative;
  flex-shrink: 0;
}

.app-phone-input__code-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1);
  width: 100px;
  height: 40px;
  padding: 0 var(--space-3);
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-base);
  color: var(--color-text-muted);
  cursor: pointer;
  white-space: nowrap;

  @media (min-width: 1280px) {
    height: 44px;
  }

  &:hover {
    color: var(--color-text);
  }
}

.app-phone-input__chevron {
  font-size: 16px !important;
  flex-shrink: 0;
}

.app-phone-input__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  width: 280px;
  max-height: 260px;
  overflow-y: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
}

.app-phone-input__search-wrap {
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

.app-phone-input__search-icon {
  font-size: 18px !important;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.app-phone-input__search {
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

.app-phone-input__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: 8px var(--space-3);
  font-size: var(--text-sm);
  font-family: var(--font-base);
  color: var(--color-text);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  flex-shrink: 0;
  outline: none;

  &:hover,
  &.is-focused { background: var(--color-surface-hover); }
}

.app-phone-input__option-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-phone-input__option-prefix {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.app-phone-input__empty {
  padding: var(--space-4) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
}

.app-phone-input__number {
  flex: 1;
  min-width: 0;
  border-radius: 0 var(--radius-md) var(--radius-md) 0 !important;
}
</style>
