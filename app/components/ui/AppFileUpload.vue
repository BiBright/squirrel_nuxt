<template>
  <div class="app-file-upload">
    <label :for="uid" class="app-file-upload__btn" @click="onBtnClick">
      <span class="material-icons-round">{{ icon }}</span>
      {{ label }}
    </label>
    <input :id="uid" ref="inputEl" type="file" :accept="accept" class="app-file-upload__input" @change="onChange" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  icon?: string
  accept?: string
}>(), {
  label: 'Attach File',
  icon: 'attach_file',
  accept: '*',
})

const emit = defineEmits<{
  change: [file: File]
}>()

const uid = `file-upload-${Math.random().toString(36).slice(2)}`
const inputEl = ref<HTMLInputElement | null>(null)

function onBtnClick() {
  if (inputEl.value) inputEl.value.value = ''
}

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('change', file)
}
</script>

<style scoped>
.app-file-upload__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary-25);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--color-primary-subtle);
  }

  .material-icons-round {
    font-size: 18px;
  }
}

.app-file-upload__input {
  display: none;
}
</style>
