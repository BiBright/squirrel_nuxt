<template>
  <div>
    <AppPageHeader :title="isEdit ? 'Edit User' : 'New User'" :subtitle="isEdit ? 'Update user details.' : 'Create a new team member.'">
      <AppButton variant="ghost" to="/users">
        <span class="material-icons-round">arrow_back</span>
        Back
      </AppButton>
    </AppPageHeader>

    <div v-if="submitError" class="login-error">
      <span class="material-icons-round">error_outline</span>
      {{ submitError }}
    </div>

    <div v-if="loadingRecord" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading user...</p>
      </div>
    </div>

    <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
      <AppCard title="User Details">
        <AppInput v-model="form.name" label="Name" placeholder="Enter full name" :error="errors.name" />
        <AppInput v-model="form.email" label="Email" type="email" placeholder="Enter email address" :error="errors.email" />
        <AppInput v-model="form.phone" label="Phone" placeholder="Enter phone number" :optional="true" />
        <AppInput v-model="form.job_sector" label="Job Sector" placeholder="Enter job sector" :optional="true" />
      </AppCard>

      <div class="create-form__actions">
        <AppButton variant="ghost" to="/users">Cancel</AppButton>
        <AppButton type="submit" :loading="loading">{{ isEdit ? 'Update User' : 'Save User' }}</AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

const route = useRoute()
const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!id.value && id.value !== 'create')

const form = reactive({ name: '', email: '', phone: '', job_sector: '' })
const errors = reactive({ name: '', email: '' })
const loading = ref(false)
const loadingRecord = ref(false)
const submitError = ref('')

onMounted(async () => {
  if (!isEdit.value) return
  loadingRecord.value = true

  // Try auth store first (for the logged-in user's own profile)
  const authStore = useAuthStore()
  if (String(authStore.user?.id) === id.value) {
    form.name = (authStore.user?.name as string) ?? ''
    form.email = (authStore.user?.email as string) ?? ''
    loadingRecord.value = false
    return
  }

  // Try cache (populated by the users list page)
  const usersCache = useState<{ id: number; name: string; email: string; roles: string | null }[]>('users-list', () => [])
  const cached = usersCache.value.find(u => String(u.id) === id.value)

  if (cached) {
    form.name = cached.name ?? ''
    form.email = cached.email ?? ''
    loadingRecord.value = false
    return
  }

  // Fallback: fetch from API
  try {
    const api = useApi()
    const res = await api<{ data: Record<string, unknown> }>(`/users/${id.value}`)
    const d = res.data
    form.name = (d.name as string) ?? ''
    form.email = (d.email as string) ?? ''
    form.phone = (d.phone as string) ?? ''
    form.job_sector = (d.job_sector as string) ?? ''
  }
  catch { submitError.value = 'Could not load user data.' }
  finally { loadingRecord.value = false }
})

function validate(): boolean {
  errors.name = ''
  errors.email = ''
  let valid = true
  if (!form.name.trim()) { errors.name = 'Name is required.'; valid = false }
  if (!form.email) { errors.email = 'Email is required.'; valid = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email address.'; valid = false }
  return valid
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  submitError.value = ''
  try {
    const api = useApi()
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      job_sector: form.job_sector || null,
    }
    if (isEdit.value) {
      await api(`/users/${id.value}`, { method: 'PATCH', body })
    }
    else {
      await api('/users', { method: 'POST', body })
    }
    await navigateTo('/users')
  }
  catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    submitError.value = msg ?? 'Something went wrong. Please try again.'
  }
  finally { loading.value = false }
}
</script>

<style scoped>
.create-form { display: flex; flex-direction: column; gap: var(--space-6); }

.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}
</style>
