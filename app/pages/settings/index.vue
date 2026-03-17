<template>
  <div>
    <div class="page-header">
      <h1 class="title01 page-header__title">Settings</h1>
    </div>

    <div class="settings-layout">
      <!-- Left menu -->
      <aside class="settings-menu">
        <div class="settings-menu__user">
          <div class="avatar">{{ initials }}</div>
          <p class="username">{{ user?.name ?? 'User' }}</p>
          <p class="role caption2">{{ user?.email ?? '' }}</p>
          <button type="button" class="logout-btn" @click="onLogout">
            <span class="icon material-icons-round">logout</span>
            Sign out
          </button>
        </div>

        <nav class="settings-menu__nav">
          <button
            v-for="item in menuItems"
            :key="item.key"
            type="button"
            :class="['settings-menu__item', { 'is-active': activeSection === item.key }]"
            @click="activeSection = item.key"
          >
            <span class="icon material-icons-round">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </nav>
      </aside>

      <!-- Right content -->
      <section class="settings-content">
        <!-- Profile -->
        <div v-if="activeSection === 'profile'" class="settings-section">
          <h2 class="settings-section-title">Profile</h2>
          <p class="settings-section-subtitle">Update your personal information.</p>
          <AppInput v-model="profileForm.name" label="Full name" placeholder="Your name" />
          <AppInput v-model="profileForm.email" label="Email" type="email" placeholder="you@company.com" />
          <p v-if="profileError" class="text-red-500 body02">{{ profileError }}</p>
          <AppButton type="button" :loading="profileSaving" @click="saveProfile">Save changes</AppButton>
        </div>

        <!-- Password -->
        <div v-else-if="activeSection === 'password'" class="settings-section">
          <h2 class="settings-section-title">Change Password</h2>
          <p class="settings-section-subtitle">Choose a strong password.</p>
          <AppInput v-model="passwordForm.current" label="Current password" type="password" />
          <AppInput v-model="passwordForm.new" label="New password" type="password" />
          <AppInput v-model="passwordForm.confirm" label="Confirm new password" type="password" />
          <p v-if="passwordError" class="text-red-500 body02">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="text-green-600 body02">Password updated successfully.</p>
          <AppButton type="button" :loading="passwordSaving" @click="savePassword">Update password</AppButton>
        </div>

        <!-- Notifications -->
        <div v-else-if="activeSection === 'notifications' && !isCompanyUser" class="settings-section">
          <h2 class="settings-section-title">Notifications</h2>
          <p class="settings-section-subtitle">Manage how you receive notifications.</p>
          <div class="card">
            <div class="card__body">
              <p class="text-muted body01">Notification preferences coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const api = useApi()
const router = useRouter()

const user = computed(() => authStore.user as Record<string, string> | null)
const initials = computed(() => {
  const name = user.value?.name ?? ''
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'U'
})

const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')
const activeSection = ref('profile')

const menuItems = computed(() => [
  { key: 'profile',       icon: 'person',        label: 'Profile' },
  { key: 'password',      icon: 'lock',          label: 'Password' },
  ...(!isCompanyUser.value ? [{ key: 'notifications', icon: 'notifications', label: 'Notifications' }] : []),
])

const profileForm = reactive({ name: user.value?.name ?? '', email: user.value?.email ?? '' })
const passwordForm = reactive({ current: '', new: '', confirm: '' })

const profileSaving = ref(false)
const profileError = ref('')
const passwordSaving = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

async function saveProfile() {
  profileError.value = ''
  profileSaving.value = true
  try {
    const res = await api('/profile', {
      method: 'PATCH',
      body: { name: profileForm.name, email: profileForm.email },
    }) as { data: Record<string, unknown> }
    authStore.setUser(res.data)
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    profileError.value = e?.data?.message ?? 'Failed to save profile.'
  }
  finally {
    profileSaving.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  passwordSuccess.value = false
  passwordSaving.value = true
  try {
    await api('/profile', {
      method: 'POST',
      body: {
        current_password: passwordForm.current,
        password: passwordForm.new,
        password_confirmation: passwordForm.confirm,
      },
    })
    passwordSuccess.value = true
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    passwordError.value = e?.data?.message ?? 'Failed to update password.'
  }
  finally {
    passwordSaving.value = false
  }
}

function onLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
