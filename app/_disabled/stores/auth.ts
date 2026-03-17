export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 }) // 7 days
  const token = ref<string | null>(tokenCookie.value ?? null)
  const user = ref<Record<string, unknown> | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    tokenCookie.value = t
  }

  function setUser(u: Record<string, unknown>) {
    user.value = u
  }

  function logout() {
    token.value = null
    tokenCookie.value = null
    user.value = null
  }

  return { token, user, isAuthenticated, setToken, setUser, logout }
})
