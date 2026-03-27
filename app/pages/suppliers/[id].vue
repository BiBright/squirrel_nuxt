<template>
  <div>
    <div class="container">
      <div class="row">

        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Suppliers', to: '/suppliers' }]" />
        </div>

        <div class="col-12">
          <AppPageHeader :title="isEdit ? 'Edit Supplier' : 'New Supplier'" />
        </div>

        <div class="col-12">
          <div v-if="loadingRecord" class="list-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading supplier...</p>
          </div>

          <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
            <div class="col-9">
              <AppCard>
                <AppInput v-model="form.name" label="Supplier Name" placeholder="Insert supplier name" :error="errors.name" />
                <AppInput v-model="form.email" label="Email" type="email" placeholder="Insert supplier email" :error="errors.email" />
                <AppInput v-model="form.supplier_number" label="Supplier Number" placeholder="Insert supplier registration number" :optional="true" />
                <AppInput v-model="form.category" label="Supplier Category" placeholder="Insert supplier category" :optional="true" />
                <AppInput v-model="form.material_type" label="Supplier Material Type" placeholder="Insert material type" :optional="true" />
                <AppInput v-model="form.contact_person" label="Supplier Contact Person" placeholder="Insert contact person name" :optional="true" />
                <AppInput v-model="form.contact_email" label="Primary Email" type="email" placeholder="Insert primary email" :optional="true" :error="errors.contact_email" />
                <div class="form-group">
                  <label class="label01">Contact Phone <span class="optional">(optional)</span></label>
                  <div class="input-phone">
                    <input v-model="form.phone_code" type="text" class="input-text input-phone__code" placeholder="+?" style="flex: 0 0 72px" />
                    <input v-model="form.contact_phone" type="text" class="input-text input-phone__input" placeholder="Insert contact phone" style="flex: 1; min-width: 0" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="label01">Country <span class="optional">(optional)</span></label>
                  <AppSelect v-model="form.country" :options="countryOptions" style="display: block; width: 100%" />
                </div>
              </AppCard>
            </div>

            <div class="create-form__actions">
              <AppButton variant="ghost" to="/suppliers">Cancel</AppButton>
              <AppButton type="submit" :loading="loading">{{ isEdit ? 'Update' : 'Save' }}</AppButton>
            </div>
          </form>
        </div>

      </div>
    </div>
    <AppUnsavedModal :model-value="showModal" @confirm="confirmLeave" @cancel="cancelLeave" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

interface Country {
  id: number
  name: string
  code: string
  phone_code: string
}

const route = useRoute()
const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!id.value && id.value !== 'create')

const countries = ref<Country[]>([])
const countryOptions = computed(() => [
  { value: '', label: 'Select a country' },
  ...countries.value.map(c => ({ value: c.name, label: c.name })),
])

const form = reactive({
  name: '', email: '',
  supplier_number: '', category: '', material_type: '', country: '',
  contact_person: '', contact_email: '', phone_code: '', contact_phone: '',
})

watch(() => form.country, (val) => {
  const match = countries.value.find(c => c.name === val)
  if (match) form.phone_code = match.phone_code
})
const errors = reactive({ name: '', email: '', contact_email: '' })
const toast = useAppToast()
const loading = ref(false)
const loadingRecord = ref(false)

const { isDirty, showModal, confirmLeave, cancelLeave } = useUnsavedChanges()
const _ready = ref(!isEdit.value)
watch(form, () => { _ready.value && (isDirty.value = true) }, { deep: true })

onMounted(async () => {
  const api = useApi()
  api<{ data: Country[] }>('/countries').then(res => { countries.value = res.data })

  if (!isEdit.value) return
  loadingRecord.value = true
  try {
    const res = await api<{ data: Record<string, unknown> }>(`/suppliers/${id.value}`)
    const d = res.data
    form.name = (d.name as string) ?? ''
    form.email = (d.email as string) ?? ''
    form.supplier_number = (d.supplier_number as string) ?? ''
    form.category = (d.category as string) ?? ''
    form.material_type = (d.material_type as string) ?? ''
    form.country = (d.country as string) ?? ''
    form.contact_person = (d.contact_person as string) ?? ''
    form.contact_email = (d.contact_email as string) ?? ''
    form.contact_phone = (d.contact_phone as string) ?? ''
    form.phone_code = (d.phone_code as string) ?? ''
  }
  catch (err) { toast.error(err, 'Could not load supplier data', { category: 'supplier' }) }
  finally { loadingRecord.value = false; nextTick(() => { _ready.value = true }) }
})

function validate(): boolean {
  errors.name = ''
  errors.email = ''
  errors.contact_email = ''
  let valid = true
  if (!form.name.trim()) { errors.name = 'Name is required.'; valid = false }
  if (!form.email) { errors.email = 'Email is required.'; valid = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email address.'; valid = false }
  if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) { errors.contact_email = 'Enter a valid email address.'; valid = false }
  return valid
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true

  try {
    const api = useApi()
    const body = {
      name: form.name,
      email: form.email,
      supplier_number: form.supplier_number || null,
      category: form.category || null,
      material_type: form.material_type || null,
      country: form.country || null,
      contact_person: form.contact_person || null,
      contact_email: form.contact_email || null,
      phone_code: form.phone_code || null,
      contact_phone: form.contact_phone || null,
    }
    
    if (isEdit.value) {
      await api(`/suppliers/${id.value}`, { method: 'PATCH', body })
      toast.success('Supplier updated', { category: 'supplier' })
    }
    else {
      await api('/suppliers', { method: 'POST', body })
      toast.success('Supplier created', { category: 'supplier' })
    }
    isDirty.value = false
    await navigateTo('/suppliers')
  }
  catch (err: unknown) {
    toast.error(err, isEdit.value ? 'Could not update supplier' : 'Could not create supplier', { category: 'supplier' })
  }
  finally { loading.value = false }
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.input-phone {
  display: flex;

  &__code {
    padding: 0 var(--space-3);
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-right: none;
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__input {
    flex: 1;
    border-radius: 0 var(--radius-md) var(--radius-md) 0 !important;
  }
}

:deep(.app-select__btn) {
  width: 100%;
  height: 44px;
  font-size: var(--text-sm);
}

.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}
</style>
