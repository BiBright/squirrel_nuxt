<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="onOverlayClick">
        <div :class="['modal', variantClass, sizeClass]" role="dialog" :aria-labelledby="titleId">
          <div v-if="title || closable" class="modal__header">
            <h2 v-if="title" :id="titleId" class="modal__title">{{ title }}</h2>
            <button v-if="closable" type="button" class="modal__close" aria-label="Close" @click="close">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <div class="modal__body">
            <span v-if="icon" class="material-icons-round modal__icon">{{ icon }}</span>
            <slot />
          </div>

          <div class="modal__footer">
            <slot name="footer">
              <AppButton variant="ghost" :full-width="true" @click="onCancel">{{ cancelLabel }}</AppButton>
              <AppButton :variant="confirmVariant" :full-width="true" :loading="confirmLoading" @click="onConfirm">{{ confirmLabel }}</AppButton>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  variant?: 'default' | 'danger' | 'premium'
  size?: 'default' | 'wide' | 'narrow'
  closable?: boolean
  closeOnOverlay?: boolean
  icon?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  confirmLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  closable: true,
  closeOnOverlay: true,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmVariant: 'primary',
  confirmLoading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'confirm': []
  'cancel': []
}>()

const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`

const variantClass = computed(() => props.variant !== 'default' ? `modal--${props.variant}` : '')
const sizeClass = computed(() => props.size !== 'default' ? `modal--${props.size}` : '')

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick() {
  if (props.closeOnOverlay) close()
}

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<style scoped>
.modal__body {
  text-align: center;
}

.modal__icon {
  display: block;
  font-size: 40px;
  color: var(--color-yellow);
  margin-bottom: var(--space-4);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.96);
  opacity: 0;
}
</style>
