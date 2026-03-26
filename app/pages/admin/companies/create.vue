<template>
  <div>
    <AppPageHeader title="New Company" subtitle="Register a new company and its admin user.">
      <AppButton variant="ghost" to="/admin/companies">
        <span class="material-icons-round">arrow_back</span>
        Back
      </AppButton>
    </AppPageHeader>

    <form novalidate class="create-form" @submit.prevent="onSubmit">
      <AppCard title="Company Details">
        <AppInput
          v-model="form.name"
          label="Company Name"
          placeholder="Enter company name"
          :error="errors.name"
        />
        <AppInput
          v-model="form.plan_id"
          label="Plan"
          type="select"
          placeholder="Select a plan"
          :error="errors.plan_id"
        >
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">
            {{ plan.name }}
          </option>
        </AppInput>
        <AppInput
          v-model="form.country"
          label="Country"
          placeholder="Enter country"
          :error="errors.country"
        />
        <AppInput
          v-model="form.city"
          label="City"
          placeholder="Enter city"
          :error="errors.city"
        />
        <AppInput
          v-model="form.address"
          label="Address"
          placeholder="Enter address"
          :error="errors.address"
        />
        <AppInput
          v-model="form.zip_code"
          label="Zip Code"
          placeholder="Enter zip code"
          :error="errors.zip_code"
        />
        <div class="form-group">
          <label class="label01">
            <input v-model="form.is_trial" type="checkbox" class="input-checkbox" />
            Start on trial period
          </label>
        </div>
      </AppCard>

      <AppCard title="Account Info">
        <AppInput
          v-model="form.admin_name"
          label="Full Name"
          placeholder="Enter admin full name"
          :error="errors.admin_name"
        />
        <AppInput
          v-model="form.admin_email"
          label="Email"
          type="email"
          placeholder="Enter admin email"
          :error="errors.admin_email"
        />
        <p class="body02 text-muted">The admin will receive an email to set their password.</p>
      </AppCard>

      <div class="create-form__actions">
        <AppButton variant="ghost" to="/admin/companies">Cancel</AppButton>
        <AppButton type="submit" :loading="loading">Save Company</AppButton>
      </div>
    </form>
  <AppUnsavedModal :model-value="showModal" @confirm="confirmLeave" @cancel="cancelLeave" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Plan {
  id: number
  name: string
}

const plans = ref<Plan[]>([])

const form = reactive({
  name: '',
  plan_id: '' as number | '',
  country: '',
  city: '',
  address: '',
  zip_code: '',
  is_trial: false,
  admin_name: '',
  admin_email: '',
})

const errors = reactive({
  name: '',
  plan_id: '',
  country: '',
  city: '',
  address: '',
  zip_code: '',
  admin_name: '',
  admin_email: '',
})

const toast = useAppToast()
const loading = ref(false)

const { isDirty, showModal, confirmLeave, cancelLeave } = useUnsavedChanges()
watch(form, () => { isDirty.value = true }, { deep: true })

onMounted(async () => {
  try {
    console.log('Fetching plans...')
    const api = useApi()
    const res = await api<{ data: Plan[] }>('/master/plans')
    plans.value = res.data
  }
  catch (err) {
    toast.error(err, 'Failed to load plans', { category: 'general' })
  }
})

function validate(): boolean {
  Object.keys(errors).forEach(k => (errors[k as keyof typeof errors] = ''))
  let valid = true

  if (!form.name) { errors.name = 'Company name is required.'; valid = false }
  if (!form.plan_id) { errors.plan_id = 'Plan is required.'; valid = false }
  if (!form.country) { errors.country = 'Country is required.'; valid = false }
  if (!form.city) { errors.city = 'City is required.'; valid = false }
  if (!form.address) { errors.address = 'Address is required.'; valid = false }
  if (!form.zip_code) { errors.zip_code = 'Zip code is required.'; valid = false }
  if (!form.admin_name) { errors.admin_name = 'Admin name is required.'; valid = false }

  if (!form.admin_email) {
    errors.admin_email = 'Admin email is required.'
    valid = false
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) {
    errors.admin_email = 'Enter a valid email address.'
    valid = false
  }

  return valid
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true

  try {
    const api = useApi()
    await api('/master/companies', {
      method: 'POST',
      body: { ...form },
    })

    toast.success('Company created', { category: 'general' })
    isDirty.value = false
    await navigateTo('/admin/companies')
  }
  catch (err: unknown) {
    toast.error(err, 'Could not create company', { category: 'general' })
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}

.input-checkbox {
  margin-right: var(--space-2);
  cursor: pointer;
}
</style>
