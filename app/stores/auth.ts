export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24 * 7 })
  const userCookie = useCookie<Record<string, unknown> | null>('auth_user', { maxAge: 60 * 60 * 24 * 7 })

  const token = ref<string | null>(tokenCookie.value ?? null)
  const user = ref<Record<string, unknown> | null>(userCookie.value ?? null)

  const isAuthenticated = computed(() => !!user.value)

  function setToken(t: string) {
    token.value = t
    tokenCookie.value = t
  }

  function setUser(u: Record<string, unknown>) {
    user.value = u
    userCookie.value = u
  }

  function logout() {
    token.value = null
    tokenCookie.value = null
    user.value = null
    userCookie.value = null
  }

  return { token, user, isAuthenticated, setToken, setUser, logout }
})
