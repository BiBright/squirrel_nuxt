<template>
  <div class="form-group">
    <label v-if="label" class="label01">
      {{ label }}
      <span v-if="optional" class="optional">(optional)</span>
    </label>
    <AppSearchSelect
      :model-value="modelValue"
      :options="mappedOptions"
      :placeholder="placeholder"
      :searchable="searchable"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string | number
  items: Record<string, unknown>[]
  valueKey?: string
  labelKey?: string
  label?: string
  placeholder?: string
  error?: string
  optional?: boolean
  searchable?: boolean
}>(), {
  valueKey: 'value',
  labelKey: 'label',
  searchable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const mappedOptions = computed(() =>
  props.items.map(item => ({
    value: item[props.valueKey] as string | number,
    label: item[props.labelKey] as string,
  })),
)
</script>

<style scoped>
.field-error {
  font-size: var(--text-sm);
  color: var(--color-danger);
  margin-top: var(--space-1);
}
</style>
