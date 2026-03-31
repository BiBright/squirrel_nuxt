<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <AppBreadcrumb :items="[{ label: 'Companies', to: '/admin/companies' }, { label: isEdit ? (company?.name ?? 'Edit Company') : 'New Company' }]" />
      </div>

      <div class="col-12">
        <AppPageHeader :title="isEdit ? 'Edit company' : 'Create company'" />
      </div>

      <div class="col-12">
        <form novalidate @submit.prevent="onSubmit">

          <!-- Active/Inactive toggle (edit only) -->
          <template v-if="isEdit">
            <div class="company-status-row">
              <div class="company-status-left">
                <span class="material-icons-round">power_settings_new</span>
                <p class="company-status-title">{{ form.is_active ? 'Active' : 'Inactive' }}</p>
              </div>
              <label class="toggle-switch">
                <input v-model="form.is_active" type="checkbox" />
                <span class="toggle-switch__track" />
              </label>
            </div>
            <p class="company-status-hint">*The company is currently {{ form.is_active ? 'active' : 'inactive' }}</p>
          </template>

          <!-- Plan -->
          <div class="create-section">
            <p class="create-section__title title04">Plan</p>
            <p v-if="planExpiresLabel" class="company-plan-hint">{{ planExpiresLabel }}</p>
            <AppSelect v-model="form.plan_id" :options="planOptions" />
            <p v-if="errors.plan_id" class="create-field-error">{{ errors.plan_id }}</p>
          </div>

          <div class="row create-columns">

            <div class="col-12 col-md-5">
              <p class="create-section__title title04">Company info</p>
              <template v-if="!isEdit">
                <AppInput
                  v-model="form.admin_name"
                  label="Admin Name"
                  placeholder="Enter admin full name"
                  :error="errors.admin_name"
                />
              </template>
              <AppInput
                v-model="form.name"
                label="Company Name"
                placeholder="Enter company name"
                :error="errors.name"
              />
              <template v-if="!isEdit">
                <AppInput
                  v-model="form.admin_email"
                  label="Email"
                  type="email"
                  placeholder="Enter admin email"
                  :error="errors.admin_email"
                />
              </template>
              <div class="form-group">
                <p class="label01">Company Logo</p>
                <AppFileUpload label="Upload logo" accept=".jpg,.jpeg,.png" @change="onLogoChange" />
                <div v-if="logoPreview" class="logo-uploaded">
                  <img :src="logoPreview" class="logo-preview" alt="Company logo" />
                  <span class="logo-filename">{{ logoFile?.name }}</span>
                </div>
              </div>
            </div>

            <div class="col-12 offset-md-1 col-md-6">
              <p class="create-section__title title04">Company location</p>
              <div class="row">
                <div class="col-6">
                  <AppInput
                    v-model="form.country"
                    label="Country"
                    placeholder="Insert country"
                    :error="errors.country"
                  />
                </div>
                <div class="col-6">
                  <AppInput
                    v-model="form.city"
                    label="City"
                    placeholder="Insert city"
                    :error="errors.city"
                  />
                </div>
              </div>
              <AppInput
                v-model="form.address"
                label="Address"
                placeholder="Insert address"
                :error="errors.address"
              />
              <AppInput
                v-model="form.zip_code"
                label="Post code"
                placeholder="Insert post code"
                :error="errors.zip_code"
              />
            </div>

          </div>

          <!-- Actions -->
          <div class="create-actions">
            <AppButton variant="ghost" to="/admin/companies">Cancel</AppButton>
            <AppButton type="submit" :loading="loading">{{ isEdit ? 'Save' : 'Create' }}</AppButton>
          </div>

        </form>
      </div>
    </div>
  </div>
  <AppUnsavedModal :model-value="showModal" @confirm="confirmLeave" @cancel="cancelLeave" />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Plan {
  id: number
  name: string
}

interface Company {
  id: number
  name: string
  country: string
  city: string
  address: string
  zip_code: string
  is_active: boolean
  plan_expires_at: string | null
  plan: Plan
}

const route = useRoute()
const id = route.params.id as string
const isEdit = computed(() => id !== 'new')

const plans = ref<Plan[]>([])
const planOptions = computed(() => [
  { value: '', label: 'Select a plan' },
  ...plans.value.map(p => ({ value: p.id, label: p.name })),
])
const company = ref<Company | null>(null)

const planExpiresLabel = computed(() => {
  if (!company.value?.plan || !company.value?.plan_expires_at) return ''
  const date = new Date(company.value.plan_expires_at)
  const formatted = date.toLocaleDateString('en-GB').replace(/\//g, '-')
  return `This company has the ${company.value.plan.name} plan until ${formatted}`
})

const form = reactive({
  name: '',
  plan_id: '' as number | '',
  country: '',
  city: '',
  address: '',
  zip_code: '',
  is_active: true,
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

const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)

function onLogoChange(file: File) {
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

const toast = useAppToast()
const loading = ref(false)

const { isDirty, showModal, confirmLeave, cancelLeave } = useUnsavedChanges()

onMounted(async () => {
  const api = useApi()

  try {
    if (isEdit.value) {
      const [plansRes, companyRes] = await Promise.all([
        api<{ data: Plan[] }>('/master/plans'),
        api<{ data: Company }>(`/master/companies/${id}`),
      ])
      plans.value = plansRes.data
      company.value = companyRes.data
      form.name = companyRes.data.name
      form.plan_id = companyRes.data.plan.id
      form.country = companyRes.data.country
      form.city = companyRes.data.city
      form.address = companyRes.data.address
      form.zip_code = companyRes.data.zip_code
      form.is_active = companyRes.data.is_active
    }
    else {
      const res = await api<{ data: Plan[] }>('/master/plans')
      plans.value = res.data
    }
  }
  catch (err) {
    toast.error(err, 'Failed to load data', { category: 'general' })
  }

  watch(form, () => { isDirty.value = true }, { deep: true })
})

function validate(): boolean {
  Object.keys(errors).forEach(k => (errors[k as keyof typeof errors] = ''))
  let valid = true

  if (!form.name) { errors.name = 'Company name is required.'; valid = false }
  if (!form.plan_id) { errors.plan_id = 'Plan is required.'; valid = false }
  if (!form.country) { errors.country = 'Country is required.'; valid = false }
  if (!form.city) { errors.city = 'City is required.'; valid = false }
  if (!form.address) { errors.address = 'Address is required.'; valid = false }
  if (!form.zip_code) { errors.zip_code = 'Post code is required.'; valid = false }

  if (!isEdit.value) {
    if (!form.admin_name) { errors.admin_name = 'Admin name is required.'; valid = false }
    if (!form.admin_email) {
      errors.admin_email = 'Admin email is required.'
      valid = false
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) {
      errors.admin_email = 'Enter a valid email address.'
      valid = false
    }
  }

  return valid
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true

  try {
    const api = useApi()

    if (isEdit.value) {
      const body = new FormData()
      body.append('name', form.name)
      body.append('plan_id', String(form.plan_id))
      body.append('country', form.country)
      body.append('city', form.city)
      body.append('address', form.address)
      body.append('zip_code', form.zip_code)
      body.append('is_active', form.is_active ? '1' : '0')
      body.append('_method', 'PUT')
      if (logoFile.value) body.append('logo', logoFile.value)

      await api(`/master/companies/${id}`, { method: 'POST', body })
      toast.success('Company updated', { category: 'general' })
    }
    else {
      const body = new FormData()
      body.append('name', form.name)
      body.append('plan_id', String(form.plan_id))
      body.append('country', form.country)
      body.append('city', form.city)
      body.append('address', form.address)
      body.append('zip_code', form.zip_code)
      body.append('admin_name', form.admin_name)
      body.append('admin_email', form.admin_email)
      if (logoFile.value) body.append('logo', logoFile.value)

      await api('/master/companies', { method: 'POST', body })
      toast.success('Company created', { category: 'general' })
    }

    isDirty.value = false
    await navigateTo('/admin/companies')
  }
  catch (err: unknown) {
    toast.error(err, isEdit.value ? 'Could not update company' : 'Could not create company', { category: 'general' })
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped>
.company-status-row {
  border: 1px solid var(--color-white20);
  padding: var(--space-5);
  border-radius: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  margin-bottom: var(--space-2);
}

.company-status-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.company-status-title {
  margin: 0;
}

.company-status-hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-8);
}

.company-plan-hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}

.create-section {
  margin-bottom: var(--space-8);
}

.create-section__title {
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

.create-columns {
  margin-bottom: var(--space-4);
}

.logo-uploaded {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.logo-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.logo-filename {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.create-field-error {
  font-size: var(--text-sm);
  color: var(--color-danger);
  margin-top: var(--space-1);
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}
</style>
