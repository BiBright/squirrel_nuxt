<template>
  <div>
    <AppPageHeader :title="isEdit ? 'Edit Supplier' : 'New Supplier'" :subtitle="isEdit ? 'Update supplier details.' : 'Register a new supplier.'">
      <AppButton variant="ghost" to="/suppliers">
        <span class="material-icons-round">arrow_back</span>
        Back
      </AppButton>
    </AppPageHeader>

    <div v-if="loadingRecord" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading supplier...</p>
      </div>
    </div>

    <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
      <AppCard title="Supplier Details">
        <AppInput v-model="form.name" label="Name" placeholder="Enter supplier name" :error="errors.name" />
        <AppInput v-model="form.email" label="Email" type="email" placeholder="Enter supplier email" :error="errors.email" />
        <AppInput v-model="form.supplier_number" label="Supplier Number" placeholder="Enter supplier registration number" :optional="true" />
        <AppInput v-model="form.category" label="Category" placeholder="Enter supplier category" :optional="true" />
        <AppInput v-model="form.material_type" label="Material Type" placeholder="Enter material type" :optional="true" />
        <AppInput v-model="form.country" label="Country" placeholder="Enter country" :optional="true" />
      </AppCard>

      <AppCard title="Contact">
        <AppInput v-model="form.contact_person" label="Contact Person" placeholder="Enter contact person name" :optional="true" />
        <AppInput v-model="form.contact_email" label="Contact Email" type="email" placeholder="Enter contact email" :optional="true" :error="errors.contact_email" />
        <AppInput v-model="form.contact_phone" label="Contact Phone" placeholder="Enter contact phone" :optional="true" />
      </AppCard>

      <div class="create-form__actions">
        <AppButton variant="ghost" to="/suppliers">Cancel</AppButton>
        <AppButton type="submit" :loading="loading">{{ isEdit ? 'Update Supplier' : 'Save Supplier' }}</AppButton>
      </div>
    </form>
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
  finally { loadingRecord.value = false }
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
    await navigateTo('/suppliers')
  }
  catch (err: unknown) {
    toast.error(err, isEdit.value ? 'Could not update supplier' : 'Could not create supplier', { category: 'supplier' })
  }
  finally { loading.value = false }
}
</script>

<style scoped>
.create-form { display: flex; flex-direction: column; gap: var(--space-6); }

.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}
</style>
