export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (authStore.user?.roles === 'company-user') {
    return navigateTo('/')
  }
})
