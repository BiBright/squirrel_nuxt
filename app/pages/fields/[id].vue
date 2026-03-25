<template>
  <div>
    <div class="container">
      <div class="row">

        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Models' }, { label: 'Fields', to: '/fields' }]" />
        </div>

        <div class="col-12">
          <AppPageHeader :title="isEdit ? 'Edit Field' : 'New Field'" />

          <div v-if="loadingRecord" class="list-container">
            <div class="list-empty">
              <span class="material-icons-round">hourglass_empty</span>
              <p>Loading field...</p>
            </div>
          </div>

          <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
            <div class="col-10">
              <AppCard>
                <AppInput
                  v-model="form.name"
                  label="Field name"
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
              </AppCard>
            </div>

            <AppCard>
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
                    <input v-model="form.type" type="radio" :value="t.value" class="field-type-radio">
                    <span class="material-icons-round">{{ t.icon }}</span>
                    <span class="field-type-label">{{ t.label }}</span>
                  </label>
                </div>
              </div>
            </AppCard>

            <div v-if="form.type === 'template_file' || form.type === 'template_file_input'" class="col-10">
              <AppCard>
                <div class="form-group">
                  <label class="label01">{{ form.type === 'template_file' ? 'Template File' : 'Supplier File' }}</label>
                  <p class="label02">{{ form.type === 'template_file' ? 'Attach the template file suppliers will download and fill out.' : 'Suppliers will upload a file for this field.' }}</p>

                  <div v-if="templateFile || (isEdit && existingTemplateFile)" class="file-selected">
                    <span class="material-icons-round">attach_file</span>
                    {{ templateFile?.name ?? existingTemplateFile }}
                    <button type="button" class="file-remove-btn" @click="templateFile = null">
                      <span class="material-icons-round">close</span>
                    </button>
                  </div>
                  <template v-else>
                    <label for="template-file-input" class="attach-btn">
                      <span class="material-icons-round">attach_file</span>
                      Attach File
                    </label>
                    <input id="template-file-input" ref="templateFileInput" type="file" class="input-file" accept=".pdf,.doc,.docx,.xls,.xlsx" @change="onTemplateFileChange">
                  </template>
                </div>
              </AppCard>
            </div>

            <div class="create-form__actions">
              <AppButton variant="ghost" to="/fields">Cancel</AppButton>
              <AppButton type="submit" :loading="loading">{{ isEdit ? 'Update' : 'Save' }}</AppButton>
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
  { value: 'short_text', label: 'Short Text', icon: 'short_text' },
  { value: 'long_text', label: 'Long Text', icon: 'notes' },
  { value: 'numeric', label: 'Numeric', icon: 'pin' },
  { value: 'date', label: 'Date', icon: 'calendar_today' },
  { value: 'template_file', label: 'Template File', icon: 'file_download' },
  { value: 'template_file_input', label: 'Supplier File', icon: 'file_upload' }
]

const form = reactive({ name: '', description: '', type: '', is_active: true })
const errors = reactive({ name: '', type: '' })
const toast = useAppToast()
const loading = ref(false)
const loadingRecord = ref(false)
const templateFile = ref<File | null>(null)
const templateFileInput = ref<HTMLInputElement | null>(null)
const existingTemplateFile = ref<string | null>(null)

function onTemplateFileChange(e: Event) {
  templateFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

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
    existingTemplateFile.value = (d.template_file_name as string) ?? null
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
    const body = new FormData()
    body.append('name', form.name)
    if (form.description) body.append('description', form.description)
    body.append('type', form.type)
    body.append('is_active', String(form.is_active))
    if (templateFile.value) body.append('template_file', templateFile.value)
    if (isEdit.value) {
      body.append('_method', 'PATCH')
      await api(`/fields/${id.value}`, { method: 'POST', body })
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
  user-select: none;
}

.field-type-option:hover {
  background: var(--color-surface-hover);
}

.field-type-option.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.field-type-radio {
  display: none;
}

.field-type-label {
  font-size: var(--text-sm);
  font-weight: 500;
}

.input-checkbox {
  margin-right: var(--space-2);
  cursor: pointer;
}

.input-file {
  display: none;
}

.attach-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-25);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  width: fit-content;
}

.attach-btn:hover { background: var(--color-primary-subtle); }
.attach-btn .material-icons-round { font-size: 18px; }
.file-selected .material-icons-round {
  font-size: 18px;
}

.file-selected {
  width: fit-content;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--color-primary-25);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.file-remove-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 0;
}

.file-remove-btn:hover {
  color: var(--color-danger);
}
</style>
