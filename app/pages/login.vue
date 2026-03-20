<template>
  <div class="login-page">
    <div class="login-visual">
      <img src="/images/image_login.png" alt="" class="login-visual__bg" />
      <div class="login-visual__container">
        <img src="/images/logo.png" alt="Squirrel" class="login-visual__logo" />
      </div>
    </div>
  
    <div class="login-form-wrapper">
      <!-- Logo shown only on mobile (left panel is hidden) -->
      <div class="login-mobile-logo">
        <img src="/images/logo.png" alt="Squirrel" />
      </div>
  
      <h1 class="title01">Login</h1>
      <p class="body01">Please enter your details to log into your account.</p>
  
      <div v-if="loginError" class="login-error">
        <span class="material-icons-round">error_outline</span>
        {{ loginError }}
      </div>
  
      <form novalidate @submit.prevent="onSubmit">
        <AppInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="Insert email"
          :error="errors.email"
        />
        <AppInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="Insert password"
          :error="errors.password"
        />
  
        <div class="login-form-submit">
          <AppButton type="submit" :loading="loading" :full-width="true">
            Log in
          </AppButton>
        </div>
      </form>
  
      <div class="login-form-footer">
        <AppButton variant="ghost" tag="button" type="button" @click="onForgotPassword">
          Reset Password
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuth()

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
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    valid = false
  }
  else if (form.password.length < 6) {
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
    await auth.login(form.email, form.password)
    await navigateTo('/')
  }
  catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    loginError.value = msg ?? 'Invalid credentials. Please try again.'
  }
  finally {
    loading.value = false
  }
}

function onForgotPassword() {
  // TODO: navigate to reset password page
}
</script>
