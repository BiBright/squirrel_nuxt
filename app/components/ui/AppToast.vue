<template>
  <div class="toast" :class="`toast--${type}`" role="alert">
    <div class="toast__body">
      <div class="toast_close-container">
        <button type="button" class="toast__close" aria-label="Dismiss" @click="$emit('close')">
          <span class="material-icons-round">close</span>
        </button>
      </div>
      <div class="toast__icon-container">
        <span class="material-icons-round toast__icon">{{ icon }}</span>
      </div>
      <div class="toast__content">
        <p class="toast__title title03">{{ title }}</p>
        <p v-if="message" class="toast__message caption2">{{ message }}</p>
      </div>
    </div>
    <div class="toast__progress-track">
      <div class="toast__progress-bar" :style="{ animationDuration: `${duration}ms` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToastType } from '~/composables/useAppToast'

const props = defineProps<{
  type: ToastType
  title: string
  message: string
  duration: number
}>()

defineEmits<{ close: [] }>()

const icon = computed(() => props.type === 'success' ? 'check_circle' : 'error')
</script>

<style scoped>
.toast {
  width: 340px;
  max-width: 100%;
  border-radius: var(--radius-md);
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  pointer-events: all;
}

.toast--success {
  background: var(--color-green-25);
}

.toast--error {
  background: var(--color-red-25);
}

.toast__body {
  padding: 14px;
}

.toast__icon-container {
  margin: 0 0 4px;
  display: flex;
  justify-content: center;
}

.toast__icon {
  font-size: 20px !important;
  flex-shrink: 0;
}

.toast--success .toast__icon {
  color: var(--color-green);
}

.toast--error .toast__icon {
  color: var(--color-red);
}

.toast__content {
  display: block;
  text-align: center;
  min-width: 0;
}

.toast__title {
  color: var(--color-text);
}

.toast__message {
  color: var(--color-text-muted);
}

.toast_close-container {
  display: flex;
  justify-content: end;
}

.toast__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  display: flex;
  justify-content: end;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: color 0.15s;
}

.toast__close:hover {
  color: var(--color-text);
}

.toast__close .material-icons-round {
  font-size: 18px;
}

.toast__progress-track {
  height: 3px;
  overflow: hidden;
}

.toast__progress-bar {
  height: 100%;
  width: 100%;
  transform-origin: left;
  animation: toast-progress linear forwards;
}

.toast--success .toast__progress-bar {
  background: var(--color-green-75);
}

.toast--error .toast__progress-bar {
  background: var(--color-red-75);
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}
</style>
