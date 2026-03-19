<template>
  <div>
    <AppPageHeader :title="form.title || 'Edit Request'" subtitle="Update forms and suppliers for this request.">
      <AppButton variant="ghost" to="/requests">
        <span class="material-icons-round">arrow_back</span>
        Back
      </AppButton>
    </AppPageHeader>

    <div v-if="loadingRequest" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading request...</p>
      </div>
    </div>

    <template v-else>
      <form novalidate class="create-form" @submit.prevent="onSubmit">
        <AppCard title="Details">
          <AppInput
            v-model="form.title"
            label="Title"
            placeholder="Optional title for this request"
            :optional="true"
          />
        </AppCard>

        <!-- Forms selection -->
        <AppCard title="Forms">
          <p v-if="errors.form_ids" class="input-error-msg">{{ errors.form_ids }}</p>
          <div v-if="loadingForms" class="create-select__loading">Loading forms...</div>
          <div v-else-if="availableForms.length === 0" class="create-select__empty">No active forms available.</div>
          <template v-else>
            <AppInput v-model="formSearch" type="search" placeholder="Search forms..." />
            <div class="create-select__list">
              <label
                v-for="f in filteredForms"
                :key="f.id"
                class="create-select__item"
                :class="{ 'is-selected': form.form_ids.includes(f.id) }"
              >
                <input
                  type="checkbox"
                  :value="f.id"
                  :checked="form.form_ids.includes(f.id)"
                  class="create-select__checkbox"
                  @change="toggleForm(f.id)"
                />
                <span class="create-select__name">{{ f.name }}</span>
              </label>
            </div>
            <p class="create-select__count">{{ form.form_ids.length }} selected</p>
          </template>
        </AppCard>

        <!-- Suppliers selection -->
        <AppCard title="Suppliers">
          <p v-if="errors.supplier_ids" class="input-error-msg">{{ errors.supplier_ids }}</p>
          <div v-if="loadingSuppliers" class="create-select__loading">Loading suppliers...</div>
          <div v-else-if="availableSuppliers.length === 0" class="create-select__empty">No suppliers registered yet.</div>
          <template v-else>
            <AppInput v-model="supplierSearch" type="search" placeholder="Search suppliers..." />
            <div class="create-select__list">
              <label
                v-for="s in filteredSuppliers"
                :key="s.id"
                class="create-select__item"
                :class="{ 'is-selected': form.supplier_ids.includes(s.id) }"
              >
                <input
                  type="checkbox"
                  :value="s.id"
                  :checked="form.supplier_ids.includes(s.id)"
                  class="create-select__checkbox"
                  @change="toggleSupplier(s.id)"
                />
                <div>
                  <span class="create-select__name">{{ s.name }}</span>
                  <span class="create-select__sub">{{ s.email }}</span>
                </div>
              </label>
            </div>
            <p class="create-select__count">{{ form.supplier_ids.length }} selected</p>
          </template>
        </AppCard>

        <div class="create-form__actions">
          <AppButton variant="ghost" to="/requests">Cancel</AppButton>
          <AppButton type="submit" :loading="loading">Save Changes</AppButton>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = computed(() => route.params.id as string)

interface FormOption {
  id: number
  name: string
}

interface SupplierOption {
  id: number
  name: string
  email: string
}

const form = reactive({
  title: '',
  form_ids: [] as number[],
  supplier_ids: [] as number[],
})

const errors = reactive({
  form_ids: '',
  supplier_ids: '',
})

const availableForms = ref<FormOption[]>([])
const availableSuppliers = ref<SupplierOption[]>([])
const formSearch = ref('')
const supplierSearch = ref('')
const toast = useAppToast()
const loadingRequest = ref(true)
const loadingForms = ref(true)
const loadingSuppliers = ref(true)
const loading = ref(false)

const filteredForms = computed(() => {
  if (!formSearch.value) return availableForms.value
  const q = formSearch.value.toLowerCase()
  return availableForms.value.filter(f => f.name.toLowerCase().includes(q))
})

const filteredSuppliers = computed(() => {
  if (!supplierSearch.value) return availableSuppliers.value
  const q = supplierSearch.value.toLowerCase()
  return availableSuppliers.value.filter(s =>
    s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
  )
})

onMounted(async () => {
  const api = useApi()

  const [requestRes, formsRes, suppliersRes] = await Promise.allSettled([
    api<{ data: { id: number; title: string | null; forms: { form_id: number; suppliers: { supplier: { id: number } }[] }[] } }>(`/requests/${id.value}`),
    api<{ data: FormOption[] }>('/forms'),
    api<{ data: SupplierOption[] }>('/suppliers'),
  ])

  if (formsRes.status === 'fulfilled') {
    const d = formsRes.value.data
    availableForms.value = Array.isArray(d) ? d : (d as unknown as { data: FormOption[] }).data ?? []
  }
  loadingForms.value = false

  if (suppliersRes.status === 'fulfilled') {
    const d = suppliersRes.value.data
    availableSuppliers.value = Array.isArray(d) ? d : (d as unknown as { data: SupplierOption[] }).data ?? []
  }
  loadingSuppliers.value = false

  if (requestRes.status === 'fulfilled') {
    const req = requestRes.value.data
    form.title = req.title ?? ''
    form.form_ids = req.forms.map(f => f.form_id)
    form.supplier_ids = [...new Set(req.forms.flatMap(f => f.suppliers.map(s => s.supplier.id)))]
  }
  loadingRequest.value = false
})

function toggleForm(fid: number) {
  const idx = form.form_ids.indexOf(fid)
  idx === -1 ? form.form_ids.push(fid) : form.form_ids.splice(idx, 1)
}

function toggleSupplier(sid: number) {
  const idx = form.supplier_ids.indexOf(sid)
  idx === -1 ? form.supplier_ids.push(sid) : form.supplier_ids.splice(idx, 1)
}

function validate(): boolean {
  errors.form_ids = ''
  errors.supplier_ids = ''
  let valid = true

  if (form.form_ids.length === 0) { errors.form_ids = 'Select at least one form.'; valid = false }
  if (form.supplier_ids.length === 0) { errors.supplier_ids = 'Select at least one supplier.'; valid = false }

  return valid
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true

  try {
    const api = useApi()
    await api(`/requests/${id.value}`, {
      method: 'PATCH',
      body: {
        title: form.title || null,
        form_ids: form.form_ids,
        supplier_ids: form.supplier_ids,
      },
    })

    toast.success('Request updated', { category: 'request' })
    await navigateTo('/requests')
  }
  catch (err: unknown) {
    toast.error(err, 'Could not update request', { category: 'request' })
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

.create-select__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
  max-height: 280px;
  overflow-y: auto;
}

.create-select__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}

.create-select__item:hover {
  background: var(--color-surface-hover);
}

.create-select__item.is-selected {
  background: var(--color-primary-subtle);
}

.create-select__checkbox {
  flex-shrink: 0;
  cursor: pointer;
}

.create-select__name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.create-select__sub {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.create-select__count {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.create-select__loading,
.create-select__empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  padding: var(--space-3) 0;
}
</style>
