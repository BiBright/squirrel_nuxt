/**
 * Thin $fetch wrapper pointing to the backend API.
 * Injects Bearer token on every request and handles 401 globally.
 *
 * Usage:
 *   const api = useApi()
 *   const data = await api('/auth/me')
 */
export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  function getXsrfToken(): string {
    return decodeURIComponent(
      document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1] ?? '',
    )
  }

  return $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    onRequest({ options }) {
      const token = getXsrfToken()
      options.headers = {
        'Accept': 'application/json',
        ...options.headers,
        ...(token ? { 'X-XSRF-TOKEN': token } : {}),
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout()
        navigateTo('/login')
      }
    },
  })
}
