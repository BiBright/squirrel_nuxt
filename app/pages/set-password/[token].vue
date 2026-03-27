<template>
  <div class="login-visual">
    <img src="/images/image_login.png" alt="" class="login-visual__bg" />
    <div class="login-visual__container">
      <img src="/images/logo.png" alt="Squirrel" class="login-visual__logo" />
    </div>
  </div>

  <div class="login-form-wrapper">
    <div class="login-mobile-logo">
      <img src="/images/logo.png" alt="Squirrel" />
    </div>

    <h1 class="title01">Set Password</h1>
    <p class="body01">Choose a password to activate your account.</p>

    <div v-if="errorMsg" class="login-error">
      <span class="material-icons-round">error_outline</span>
      {{ errorMsg }}
    </div>

    <form novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="Enter password"
        :error="errors.password"
      />
      <AppInput
        v-model="form.password_confirmation"
        label="Confirm Password"
        type="password"
        placeholder="Confirm password"
        :error="errors.password_confirmation"
      />

      <div class="login-form-submit">
        <AppButton type="submit" :loading="loading" :full-width="true">
          Set Password
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = route.params.token as string
const authStore = useAuthStore()

const form = reactive({ password: '', password_confirmation: '' })
const errors = reactive({ password: '', password_confirmation: '' })
const loading = ref(false)
const errorMsg = ref('')

function validate(): boolean {
  errors.password = ''
  errors.password_confirmation = ''
  let valid = true

  if (!form.password) {
    errors.password = 'Password is required.'
    valid = false
  }
  else if (form.password.length < 8) {
    errors.password = 'Minimum 8 characters.'
    valid = false
  }

  if (!form.password_confirmation) {
    errors.password_confirmation = 'Please confirm your password.'
    valid = false
  }
  else if (form.password !== form.password_confirmation) {
    errors.password_confirmation = 'Passwords do not match.'
    valid = false
  }

  return valid
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true
  errorMsg.value = ''

  try {
    const api = useApi()
    const res = await api<{ data: { user: Record<string, unknown> } }>(`/set-password/${token}`, {
      method: 'POST',
      body: { password: form.password, password_confirmation: form.password_confirmation },
    })
    authStore.logout()
    authStore.setUser(res.data.user)
    await navigateTo('/')
  }
  catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    errorMsg.value = msg ?? 'Something went wrong. The link may have expired.'
  }
  finally {
    loading.value = false
  }
}
</script>
