/**
 * Thin $fetch wrapper pointing to Nuxt server-side API proxy routes.
 * XSRF token injection and cookie forwarding are handled server-side.
 *
 * Usage:
 *   const api = useApi()
 *   const data = await api('/fields')
 */
export function useApi() {
  const auth = useAuth()

  return $fetch.create({
    baseURL: '/api',
    credentials: 'include',
    onResponseError({ response }) {
      if (response.status === 401 && import.meta.client) {
        auth.logout()
      }
    },
  })
}
