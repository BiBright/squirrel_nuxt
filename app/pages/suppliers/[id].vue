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
                <AppInput v-model="form.contact_phone" label="Contact Phone" placeholder="Insert contact phone" :optional="true" />
                <AppInput v-model="form.country" label="Country" placeholder="Insert country" :optional="true" />
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

const route = useRoute()
const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!id.value && id.value !== 'create')

const form = reactive({
  name: '', email: '',
  supplier_number: '', category: '', material_type: '', country: '',
  contact_person: '', contact_email: '', contact_phone: '',
})
const errors = reactive({ name: '', email: '', contact_email: '' })
const toast = useAppToast()
const loading = ref(false)
const loadingRecord = ref(false)

const { isDirty, showModal, confirmLeave, cancelLeave } = useUnsavedChanges()
const _ready = ref(!isEdit.value)
watch(form, () => { _ready.value && (isDirty.value = true) }, { deep: true })

onMounted(async () => {
  if (!isEdit.value) return
  loadingRecord.value = true
  try {
    const api = useApi()
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

.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}
</style>
