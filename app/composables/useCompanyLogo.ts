export function useCompanyLogo() {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const companyLogoUrl = computed(() => {
    const path = authStore.company?.logo_path as string | null
    if (!path) return null
    const storageBase = (config.public.apiBase as string).replace(/\/api$/, '') + '/storage/'
    return storageBase + path
  })

  return { companyLogoUrl }
}
