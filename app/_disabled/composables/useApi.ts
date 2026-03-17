/**
 * Thin wrapper around $fetch pointing to the backend API.
 * Usage: const api = useApi()
 *        await api('/forms', { method: 'GET' })
 */
export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: computed(() =>
      authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
    ).value,
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout()
        navigateTo('/login')
      }
    },
  })
}
