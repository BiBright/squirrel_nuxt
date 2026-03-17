<template>
  <div class="login-visual">
    <img src="/favicon.ico" alt="Squirrel" class="login-visual__logo" />
    <p class="login-visual__tagline">
      Manage your suppliers<br />with confidence.
    </p>
  </div>

  <div class="login-form-wrapper">
    <h1 class="title01">Sign in</h1>
    <p class="body01">Enter your credentials to access your account.</p>

    <form @submit.prevent="onSubmit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="you@company.com"
        :error="errors.email"
      />
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="••••••••"
        :error="errors.password"
      />

      <span v-if="loginError" class="input-error-msg" style="margin-bottom: 16px; display: block;">
        {{ loginError }}
      </span>

      <AppButton type="submit" :loading="loading" :full-width="true">
        Sign in
      </AppButton>
    </form>

    <div class="login-form-footer">
      <AppButton variant="ghost" tag="a" href="#" @click.prevent="onForgotPassword">
        Forgot your password?
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const loading = ref(false)
const loginError = ref('')

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!form.email) {
    errors.email = 'Email is required.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'Minimum 6 characters.'
    valid = false
  }

  return valid
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  loginError.value = ''
  try {
    const api = useApi()
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email: form.email, password: form.password },
    }) as { token: string; user: Record<string, unknown> }
    authStore.setToken(data.token)
    authStore.setUser(data.user)
    await router.push('/')
  } catch (err) {
    loginError.value = 'Invalid credentials. Please try again.'
  } finally {
    loading.value = false
  }
}

function onForgotPassword() {
  // TODO: navigate to reset password
}
</script>
