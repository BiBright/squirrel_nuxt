<template>
  <div>
    <div class="page-header">
      <h1 class="title01 page-header__title">Settings</h1>
    </div>

    <div class="settings-layout">
      <!-- Left menu -->
      <aside class="settings-menu" :class="{ 'settings-menu--hidden': mobileShowContent }">
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
            @click="selectSection(item.key)"
          >
            <span class="icon material-icons-round">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </nav>
      </aside>

      <!-- Right content -->
      <section class="settings-content" :class="{ 'settings-content--visible': mobileShowContent }">
        <button type="button" class="settings-back" @click="mobileShowContent = false">
          <span class="material-icons-round">arrow_back</span>
          Settings
        </button>
        <!-- Profile -->
        <div v-if="activeSection === 'profile'" class="settings-section">
          <h2 class="settings-section-title">Profile</h2>
          <p class="settings-section-subtitle">Update your personal information.</p>
          <AppInput v-model="profileForm.name" label="Full name" placeholder="Your name" />
          <AppInput v-model="profileForm.email" label="Email" type="email" placeholder="you@company.com" />
          <AppButton type="button" :loading="profileSaving" @click="saveProfile">Save changes</AppButton>
        </div>

        <!-- Password -->
        <div v-else-if="activeSection === 'password'" class="settings-section">
          <h2 class="settings-section-title">Change Password</h2>
          <p class="settings-section-subtitle">Choose a strong password.</p>
          <AppInput v-model="passwordForm.current" label="Current password" type="password" />
          <AppInput v-model="passwordForm.new" label="New password" type="password" />
          <AppInput v-model="passwordForm.confirm" label="Confirm new password" type="password" />
          <AppButton type="button" :loading="passwordSaving" @click="savePassword">Update password</AppButton>
        </div>

        <!-- Notifications -->
        <div v-else-if="activeSection === 'notifications'" class="settings-section">
          <h2 class="settings-section-title">Send notifications</h2>
          <p class="settings-section-subtitle">Change and update the suppliers notifications frequency.</p>

          <div v-if="notifLoading" class="notif-loading">Loading settings…</div>
          <template v-else>
            <div class="notif-card">
              <!-- Toggle row -->
              <div class="notif-card__header">
                <button
                  type="button"
                  :class="['notif-toggle', { 'is-on': notifForm.send_notification }]"
                  @click="notifForm.send_notification = !notifForm.send_notification"
                >
                  <span class="notif-toggle__knob" />
                </button>
                <div>
                  <p class="notif-card__title">Pending actions on requests</p>
                  <p class="notif-card__hint">All suppliers will receive notifications related to their requests.</p>
                </div>
              </div>

              <!-- Frequency options -->
              <div class="notif-freq-list" :class="{ 'is-disabled': !notifForm.send_notification }">
                <!-- Once a day -->
                <label class="notif-freq-item">
                  <input v-model="notifForm.email_frequency" type="radio" value="daily" class="notif-radio">
                  <div class="notif-freq-item__body">
                    <p class="notif-freq-item__label">Once a day</p>
                    <p class="notif-freq-item__hint">Everyday at the same hour</p>
                    <div class="notif-selects">
                      <AppSelect v-model="notifForm.email_frequency_time" :options="hourOptions" />
                    </div>
                  </div>
                </label>

                <!-- Once a week -->
                <label class="notif-freq-item">
                  <input v-model="notifForm.email_frequency" type="radio" value="weekly" class="notif-radio">
                  <div class="notif-freq-item__body">
                    <p class="notif-freq-item__label">Once a week</p>
                    <p class="notif-freq-item__hint">Every 7 days</p>
                    <div class="notif-selects">
                      <AppSelect v-model="notifForm.email_frequency_weekday" :options="weekdayOptions" />
                      <AppSelect v-model="notifForm.email_frequency_time" :options="hourOptions" />
                    </div>
                  </div>
                </label>

                <!-- Once a month -->
                <label class="notif-freq-item">
                  <input v-model="notifForm.email_frequency" type="radio" value="monthly" class="notif-radio">
                  <div class="notif-freq-item__body">
                    <p class="notif-freq-item__label">Once a month</p>
                    <p class="notif-freq-item__hint">Every 31 days</p>
                    <div class="notif-selects">
                      <AppSelect v-model="notifForm.email_frequency_day" :options="dayOptions" />
                      <AppSelect v-model="notifForm.email_frequency_time" :options="hourOptions" />
                    </div>
                  </div>
                </label>
              </div>
            </div>

<div v-if="notifForm.send_notification" class="notif-actions">
              <AppButton type="button" variant="secondary" @click="loadNotifSettings">Cancel</AppButton>
              <AppButton type="button" :loading="notifSaving" @click="saveNotif">Save</AppButton>
            </div>
          </template>
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
const toast = useAppToast()

const user = computed(() => authStore.user as Record<string, string> | null)
const initials = computed(() => {
  const name = user.value?.name ?? ''
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'U'
})

const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')
const activeSection = ref('profile')
const mobileShowContent = ref(false)

function selectSection(key: string) {
  activeSection.value = key
  mobileShowContent.value = true
}

// ── Notifications ─────────────────────────────────────
const hourOptions = Array.from({ length: 24 }, (_, h) => ({
  value: String(h).padStart(2, '0') + ':00:00',
  label: String(h).padStart(2, '0') + ':00',
}))

const weekdayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  .map(d => ({ value: d, label: d }))

const dayOptions = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}))

const notifForm = reactive({
  send_notification: false,
  email_frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
  email_frequency_weekday: 'Tuesday',
  email_frequency_day: 1,
  email_frequency_time: '23:00:00',
})
const notifLoading = ref(false)
const notifSaving = ref(false)

async function loadNotifSettings() {
  notifLoading.value = true
  try {
    const res = await api('/settings') as { data: Record<string, unknown> }
    const d = res.data
    notifForm.send_notification = Boolean(d.send_notification)
    notifForm.email_frequency = (d.email_frequency as typeof notifForm.email_frequency) ?? 'weekly'
    notifForm.email_frequency_weekday = (d.email_frequency_weekday as string) ?? 'Tuesday'
    notifForm.email_frequency_day = Number(d.email_frequency_day ?? 1)
    notifForm.email_frequency_time = (d.email_frequency_time as string) ?? '23:00:00'
  }
  catch { /* leave defaults */ }
  finally { notifLoading.value = false }
}

async function saveNotif() {
  notifSaving.value = true
  try {
    await api('/settings', {
      method: 'PATCH',
      body: {
        send_notification: notifForm.send_notification,
        email_frequency: notifForm.email_frequency,
        email_frequency_weekday: notifForm.email_frequency_weekday,
        email_frequency_day: notifForm.email_frequency_day,
        email_frequency_time: notifForm.email_frequency_time,
      },
    })
    toast.success('Notification settings saved', { category: 'notifications' })
  }
  catch (err) {
    toast.error(err, 'Failed to save notification settings', { category: 'notifications' })
  }
  finally { notifSaving.value = false }
}

watch(activeSection, (val) => {
  if (val === 'notifications') loadNotifSettings()
})

const menuItems = computed(() => [
  { key: 'profile',       icon: 'person',        label: 'Profile' },
  { key: 'password',      icon: 'lock',          label: 'Password' },
  { key: 'notifications', icon: 'notifications', label: 'Notifications' },
])

const profileForm = reactive({ name: user.value?.name ?? '', email: user.value?.email ?? '' })
const passwordForm = reactive({ current: '', new: '', confirm: '' })

const profileSaving = ref(false)
const passwordSaving = ref(false)

async function saveProfile() {
  profileSaving.value = true
  try {
    const res = await api('/profile', {
      method: 'PATCH',
      body: { name: profileForm.name, email: profileForm.email },
    }) as { data: Record<string, unknown> }
    authStore.setUser(res.data)
    toast.success('Profile updated', { category: 'profile' })
  }
  catch (err: unknown) {
    toast.error(err, 'Failed to update profile', { category: 'profile' })
  }
  finally { profileSaving.value = false }
}

async function savePassword() {
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
    toast.success('Password updated', { category: 'password' })
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
  }
  catch (err: unknown) {
    toast.error(err, 'Failed to update password', { category: 'password' })
  }
  finally { passwordSaving.value = false }
}

function onLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
