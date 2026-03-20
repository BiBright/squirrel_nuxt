export interface AuthUser {
  id: number
  name: string
  email: string
  roles: string
  [key: string]: unknown
}

export function useAuth() {
  const userCookie = useCookie<AuthUser | null>('auth_user', { maxAge: 60 * 60 * 24 * 7 })
  const user = useState<AuthUser | null>('auth.user', () => userCookie.value)
  const isAuthenticated = computed(() => !!user.value)

  function setUser(u: AuthUser) {
    user.value = u
    userCookie.value = u
  }

  async function login(email: string, password: string) {
    await $fetch('/api/auth/csrf')
    const res = await $fetch<{ data: { user: AuthUser } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setUser(res.data.user)
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    user.value = null
    userCookie.value = null
    await navigateTo('/login')
  }

  return reactive({ user, isAuthenticated, login, logout, setUser })
}
