<template>
  <AppModal
    :model-value="modelValue"
    title=""
    size="narrow"
    :closable="false"
    :close-on-overlay="false"
    @update:model-value="emit('cancel')"
  >
    <div class="unsaved-modal__body">
      <span class="material-icons-round unsaved-modal__icon">warning</span>
      <p class="unsaved-modal__message">If you continue, you will lose the changes made. Are you sure you want to proceed?</p>
    </div>

    <template #footer>
      <AppButton variant="ghost" :full-width="true" @click="emit('cancel')">Cancel</AppButton>
      <AppButton :full-width="true" @click="emit('confirm')">Continue</AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<style scoped>
:deep(.modal__header) {
  display: none;
}

:deep(.modal__footer) {
  gap: var(--space-3);

  .btn { flex: 1; }
}

.unsaved-modal__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}

.unsaved-modal__icon {
  font-size: 40px;
  color: var(--color-danger);
}

.unsaved-modal__message {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.5;
}
</style>
