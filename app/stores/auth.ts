export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24 * 7 })
  const userCookie = useCookie<Record<string, unknown> | null>('auth_user', { maxAge: 60 * 60 * 24 * 7 })
  const companyCookie = useCookie<Record<string, unknown> | null>('auth_company', { maxAge: 60 * 60 * 24 * 7 })

  const token = ref<string | null>(tokenCookie.value ?? null)
  const user = ref<Record<string, unknown> | null>(userCookie.value ?? null)
  const company = ref<Record<string, unknown> | null>(companyCookie.value ?? null)

  const isAuthenticated = computed(() => !!user.value)

  function setToken(t: string) {
    token.value = t
    tokenCookie.value = t
  }

  function setUser(u: Record<string, unknown>) {
    user.value = u
    userCookie.value = u
  }

  function setCompany(c: Record<string, unknown>) {
    company.value = c
    companyCookie.value = c
  }

  function logout() {
    token.value = null
    tokenCookie.value = null
    user.value = null
    userCookie.value = null
    company.value = null
    companyCookie.value = null
  }

  return { token, user, company, isAuthenticated, setToken, setUser, setCompany, logout }
})
