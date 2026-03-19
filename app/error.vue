<template>
  <div class="error-page">
    <AppBlankState :image="image" :title="title" :message="message">
      <AppButton @click="handleError">Go back home</AppButton>
    </AppBlankState>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } }>()

const image = computed(() => {
  if (props.error.statusCode === 404) return '/images/blankPages/404.svg'
  return '/images/blankPages/500.svg'
})

const title = computed(() => {
  if (props.error.statusCode === 404) return 'Page not found'
  return 'Something went wrong'
})

const message = computed(() => {
  if (props.error.statusCode === 404) return "The page you're looking for doesn't exist."
  return 'An unexpected server error occurred. Please try again.'
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}
</style>
