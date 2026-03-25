<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Settings' }]" />
        </div>

        <div class="col-12">
          <AppPageHeader title="Settings" />
        </div>

        <!-- Left menu -->
        <div class="col-12 col-sm-4 col-md-2">
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
              <button v-for="item in menuItems" :key="item.key" type="button"
                :class="['settings-menu__item', { 'is-active': activeSection === item.key }]"
                @click="selectSection(item.key)">
                <span class="icon material-icons-round">{{ item.icon }}</span>
                {{ item.label }}
              </button>
            </nav>
          </aside>
        </div>

        <div class="col-12 col-sm-8 col-md-9">
          <section class="settings-content" :class="{ 'settings-content--visible': mobileShowContent }">
            <button type="button" class="settings-back" @click="mobileShowContent = false">
              <span class="material-icons-round">arrow_back</span>
              Settings
            </button>

            <div v-if="activeSection === 'profile'" class="settings-section">
              <h2 class="settings-section-title">Profile</h2>
              <p class="settings-section-subtitle">Update your personal information.</p>
              <AppInput v-model="profileForm.name" label="Full name" placeholder="Your name" />
              <AppInput v-model="profileForm.email" label="Email" type="email" placeholder="you@company.com" />
              <AppButton type="button" :loading="profileSaving" @click="saveProfile">Save changes</AppButton>
            </div>

            <div v-else-if="activeSection === 'password'" class="settings-section">
              <h2 class="settings-section-title">Change Password</h2>
              <p class="settings-section-subtitle">Choose a strong password.</p>
              <AppInput v-model="passwordForm.current" label="Current password" type="password" />
              <AppInput v-model="passwordForm.new" label="New password" type="password" />
              <AppInput v-model="passwordForm.confirm" label="Confirm new password" type="password" />
              <AppButton type="button" :loading="passwordSaving" @click="savePassword">Update password</AppButton>
            </div>

            <div v-else-if="activeSection === 'company'" class="settings-section">
              <h2 class="settings-section-title">Company Settings</h2>
              <p class="settings-section-subtitle">Update your company information.</p>

              <div v-if="companyLoading" class="notif-loading">Loading…</div>
              <template v-else>
                <div class="company-logo-field">
                  <label class="label01">Company Logo</label>
                  <div class="company-logo-preview">
                    <img v-if="companyLogoPreview" :src="companyLogoPreview" class="company-logo-img" alt="Logo preview">
                    <span v-else class="company-logo-placeholder material-icons-round">business</span>
                  </div>
                  <label for="company-logo-input" class="attach-btn">
                    <span class="material-icons-round">upload</span>
                    {{ companyLogoPreview ? 'Change logo' : 'Upload logo' }}
                  </label>
                  <input id="company-logo-input" type="file" accept=".jpg,.jpeg,.png" class="input-file" @change="onLogoChange">
                </div>

                <AppInput v-model="companyForm.name" label="Company Name" placeholder="Your company name" />
                <AppInput v-model="companyForm.country" label="Country" placeholder="e.g. Portugal" />
                <AppInput v-model="companyForm.city" label="City" placeholder="e.g. Lisbon" />
                <AppInput v-model="companyForm.address" label="Address" placeholder="Street and number" :optional="true" />
                <AppInput v-model="companyForm.zip_code" label="Zip Code" placeholder="e.g. 1000-001" :optional="true" />

                <AppButton type="button" :loading="companySaving" @click="saveCompany">Save changes</AppButton>
              </template>
            </div>

            <div v-else-if="activeSection === 'notifications'" class="settings-section">
              <h2 class="settings-section-title">Send notifications</h2>
              <p class="settings-section-subtitle">Change and update the suppliers notifications frequency.</p>

              <div v-if="notifLoading" class="notif-loading">Loading settings…</div>
              <template v-else>
                <div class="notif-card">
                  <div class="notif-card__header">
                    <button type="button" :class="['notif-toggle', { 'is-on': notifForm.send_notification }]"
                      @click="notifForm.send_notification = !notifForm.send_notification">
                      <span class="notif-toggle__knob" />
                    </button>
                    <div>
                      <p class="notif-card__title">Pending actions on requests</p>
                      <p class="notif-card__hint">All suppliers will receive notifications related to their requests.
                      </p>
                    </div>
                  </div>

                  <div class="notif-freq-list" :class="{ 'is-disabled': !notifForm.send_notification }">
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
  if (val === 'company') loadCompany()
})

const menuItems = computed(() => [
  { key: 'profile', icon: 'person', label: 'Profile' },
  { key: 'password', icon: 'lock', label: 'Security and Login' },
  { key: 'company', icon: 'factory', label: 'Company Settings' },
  { key: 'notifications', icon: 'notifications', label: 'Notification' },
  { key: 'support', icon: 'support', label: 'Support' },
])

const profileForm = reactive({ name: user.value?.name ?? '', email: user.value?.email ?? '' })
const passwordForm = reactive({ current: '', new: '', confirm: '' })

const companyForm = reactive({ name: '', country: '', city: '', address: '', zip_code: '', plan_id: null as number | null })
const companyLoading = ref(false)
const companySaving = ref(false)
const companyLogoFile = ref<File | null>(null)
const companyLogoPreview = ref<string | null>(null)

async function loadCompany() {
  const companyId = (user.value?.company_id ?? user.value?.company?.id) as number | undefined
  if (!companyId) return
  companyLoading.value = true
  try {
    const res = await api(`/companies/${companyId}`) as { data: Record<string, unknown> }
    const d = res.data
    companyForm.name = (d.name as string) ?? ''
    companyForm.country = (d.country as string) ?? ''
    companyForm.city = (d.city as string) ?? ''
    companyForm.address = (d.address as string) ?? ''
    companyForm.zip_code = (d.zip_code as string) ?? ''
    companyForm.plan_id = (d.plan_id as number) ?? null
    if (d.logo_path) companyLogoPreview.value = d.logo_path as string
  }
  catch { /* leave defaults */ }
  finally { companyLoading.value = false }
}

function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  companyLogoFile.value = file
  companyLogoPreview.value = URL.createObjectURL(file)
}

async function saveCompany() {
  const companyId = (user.value?.company_id ?? user.value?.company?.id) as number | undefined
  if (!companyId) { toast.error(null, 'Company ID not found', { category: 'company' }); return }
  companySaving.value = true
  try {
    const body = new FormData()
    body.append('_method', 'PATCH')
    body.append('name', companyForm.name)
    body.append('country', companyForm.country)
    body.append('city', companyForm.city)
    body.append('address', companyForm.address)
    body.append('zip_code', companyForm.zip_code)
    if (companyForm.plan_id) body.append('plan_id', String(companyForm.plan_id))
    if (companyLogoFile.value) body.append('logo', companyLogoFile.value)
    await api(`/companies/${companyId}`, { method: 'POST', body })
    toast.success('Company settings saved', { category: 'company' })
  }
  catch (err) {
    toast.error(err, 'Failed to save company settings', { category: 'company' })
  }
  finally { companySaving.value = false }
}

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
