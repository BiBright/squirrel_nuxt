<template>
  <div class="form-group">
    <label v-if="label" :for="inputId" class="label01">
      {{ label }}
      <span v-if="optional" class="optional">(optional)</span>
    </label>
    <p v-if="description" class="label02">{{ description }}</p>

    <div v-if="type === 'password'" class="input-password-wrapper">
      <input
        :id="inputId"
        v-model="model"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholder"
        :disabled="disabled"
        class="input-text"
        v-bind="$attrs"
      />
      <button type="button" class="toggle-password" @click="showPassword = !showPassword">
        <span class="material-icons-round">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
      </button>
    </div>

    <textarea
      v-else-if="type === 'textarea'"
      :id="inputId"
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input-textarea"
      v-bind="$attrs"
    />

    <select
      v-else-if="type === 'select'"
      :id="inputId"
      v-model="model"
      :disabled="disabled"
      class="input-select"
      v-bind="$attrs"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot />
    </select>

    <input
      v-else
      :id="inputId"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="type === 'search' ? 'input-search' : 'input-text'"
      v-bind="$attrs"
    />

    <span v-if="error" class="input-error-msg">{{ error }}</span>
    <span v-else-if="success" class="input-success-msg">{{ success }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  description?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'search' | 'textarea' | 'select' | 'date' | 'number'
  optional?: boolean
  disabled?: boolean
  error?: string
  success?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  optional: false,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const model = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val),
})

const inputId = `input-${Math.random().toString(36).slice(2, 9)}`
const showPassword = ref(false)
</script>
