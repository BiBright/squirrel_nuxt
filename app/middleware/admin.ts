export default defineNuxtRouteMiddleware(() => {
  const auth = useAuth()
  if (auth.user?.roles === 'company-user') {
    return navigateTo('/')
  }
})
