<template>
  <div>
    <AppPageHeader :title="isEdit ? 'Edit Field' : 'New Field'" :subtitle="isEdit ? 'Update field details.' : 'Create a reusable input field.'">
      <AppButton variant="ghost" to="/fields">
        <span class="material-icons-round">arrow_back</span>
        Back
      </AppButton>
    </AppPageHeader>

    <div class="container">
      <div class="row">
        <div class="col-12">

          <div v-if="loadingRecord" class="list-container">
            <div class="list-empty">
              <span class="material-icons-round">hourglass_empty</span>
              <p>Loading field...</p>
            </div>
          </div>

          <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
            <AppCard title="Field Details">
              <AppInput
                v-model="form.name"
                label="Name"
                placeholder="e.g. Company Registration Number"
                :error="errors.name"
              />
              <AppInput
                v-model="form.description"
                label="Description"
                type="textarea"
                placeholder="Optional description for this field"
                :optional="true"
              />

              <div class="form-group">
                <label class="label01">Type</label>
                <p v-if="errors.type" class="input-error-msg">{{ errors.type }}</p>
                <div class="field-type-grid">
                  <label
                    v-for="t in FIELD_TYPES"
                    :key="t.value"
                    class="field-type-option"
                    :class="{ 'is-selected': form.type === t.value }"
                  >
                    <input v-model="form.type" type="radio" :value="t.value" class="field-type-radio" />
                    <span class="material-icons-round">{{ t.icon }}</span>
                    <span class="field-type-label">{{ t.label }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="label01">
                  <input v-model="form.is_active" type="checkbox" class="input-checkbox" />
                  Active
                </label>
              </div>
            </AppCard>

            <div class="create-form__actions">
              <AppButton variant="ghost" to="/fields">Cancel</AppButton>
              <AppButton type="submit" :loading="loading">{{ isEdit ? 'Update Field' : 'Save Field' }}</AppButton>
            </div>
          </form>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!id.value && id.value !== 'create')

const FIELD_TYPES = [
  { value: 'short_text',    label: 'Short Text',    icon: 'short_text' },
  { value: 'long_text',     label: 'Long Text',     icon: 'notes' },
  { value: 'numeric',       label: 'Numeric',       icon: 'pin' },
  { value: 'date',          label: 'Date',          icon: 'calendar_today' },
  { value: 'template_file', label: 'Template File', icon: 'file_download' },
  { value: 'supplier_file', label: 'Supplier File', icon: 'file_upload' },
]

const form = reactive({ name: '', description: '', type: '', is_active: true })
const errors = reactive({ name: '', type: '' })
const toast = useAppToast()
const loading = ref(false)
const loadingRecord = ref(false)

onMounted(async () => {
  if (!isEdit.value) return
  loadingRecord.value = true
  try {
    const api = useApi()
    const res = await api<{ data: typeof form & { type: string } }>(`/fields/${id.value}`)
    const d = res.data as Record<string, unknown>
    form.name = d.name as string
    form.description = (d.description as string) ?? ''
    form.type = d.type as string
    form.is_active = d.is_active as boolean
  }
  catch (err) { toast.error(err, 'Could not load field data', { category: 'field' }) }
  finally { loadingRecord.value = false }
})

function validate(): boolean {
  errors.name = ''
  errors.type = ''
  let valid = true
  if (!form.name.trim()) { errors.name = 'Name is required.'; valid = false }
  if (!form.type) { errors.type = 'Please select a type.'; valid = false }
  return valid
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    const api = useApi()
    const body = {
      name: form.name,
      description: form.description || null,
      type: form.type,
      is_active: form.is_active,
    }
    if (isEdit.value) {
      await api(`/fields/${id.value}`, { method: 'PATCH', body })
      toast.success('Field updated', { category: 'field' })
    }
    else {
      await api('/fields', { method: 'POST', body })
      toast.success('Field created', { category: 'field' })
    }
    await navigateTo('/fields')
  }
  catch (err: unknown) {
    toast.error(err, isEdit.value ? 'Could not update field' : 'Could not create field', { category: 'field' })
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

.field-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.field-type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.field-type-option:hover { background: var(--color-surface-hover); }

.field-type-option.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.field-type-radio { display: none; }

.field-type-label { font-size: var(--text-sm); font-weight: 500; }

.input-checkbox { margin-right: var(--space-2); cursor: pointer; }
</style>
