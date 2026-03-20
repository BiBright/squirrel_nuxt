export default defineNuxtRouteMiddleware(() => {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }

  if (auth.user?.roles !== 'master') {
    return navigateTo('/')
  }
})
