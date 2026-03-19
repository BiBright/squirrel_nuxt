<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <AppToast
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="toast.duration"
        @close="remove(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const { toasts, remove } = useAppToast()

</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;

  @media (max-width: 767px) {
    right: 16px;
    left: 16px;
    bottom: 16px;
    align-items: stretch;
  }
}

/* TransitionGroup animations */
.toast-enter-active {
  animation: toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
}

.toast-leave-active {
  animation: toast-out 0.2s ease forwards;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-in {
  from {
    transform: translateX(calc(100% + 24px));
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
    max-height: 100px;
    margin-bottom: 0;
  }
  to {
    transform: translateX(calc(100% + 24px));
    opacity: 0;
    max-height: 0;
    margin-bottom: -10px;
  }
}
</style>
