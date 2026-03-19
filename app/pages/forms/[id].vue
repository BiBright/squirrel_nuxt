<template>
  <div>
    <AppPageHeader :title="isEdit ? 'Edit Form' : 'New Form'" :subtitle="isEdit ? 'Update form template.' : 'Create a form template from your fields.'">
      <AppButton variant="ghost" to="/forms">
        <span class="material-icons-round">arrow_back</span>
        Back
      </AppButton>
    </AppPageHeader>

    <div v-if="loadingRecord" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading form...</p>
      </div>
    </div>

    <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
      <AppCard title="Form Details">
        <AppInput
          v-model="form.name"
          label="Name"
          placeholder="e.g. Supplier Qualification Form"
          :error="errors.name"
        />
        <AppInput
          v-model="form.description"
          label="Description"
          type="textarea"
          placeholder="Optional description"
          :optional="true"
        />

        <div class="form-group">
          <label class="label01">Template File <span class="optional">(optional)</span></label>
          <p class="label02">A reference document suppliers can download before filling the form.</p>

          <!-- Existing template (edit mode) -->
          <div v-if="isEdit && existingTemplate && !removeTemplate" class="file-selected">
            <span class="material-icons-round">attach_file</span>
            {{ existingTemplate }}
            <button type="button" class="file-remove-btn" @click="removeTemplate = true">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          <p v-else-if="isEdit && removeTemplate" class="label02" style="color: var(--color-danger)">
            Template will be removed on save.
            <button type="button" class="link" style="background:none;border:none;cursor:pointer;color:var(--color-primary)" @click="removeTemplate = false">Undo</button>
          </p>

          <input
            ref="fileInput"
            type="file"
            class="input-file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            @change="onFileChange"
          />
          <div v-if="selectedFile" class="file-selected">
            <span class="material-icons-round">attach_file</span>
            {{ selectedFile.name }}
            <button type="button" class="file-remove-btn" @click="removeFile">
              <span class="material-icons-round">close</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="label01">
            <input v-model="form.is_active" type="checkbox" class="input-checkbox" />
            Active
          </label>
        </div>
      </AppCard>

      <AppCard title="Fields">
        <p v-if="errors.fields" class="input-error-msg">{{ errors.fields }}</p>

        <div class="fields-builder">
          <div class="fields-builder__available">
            <p class="label01">Available Fields</p>
            <div v-if="loadingFields" class="create-select__loading">Loading fields...</div>
            <div v-else-if="availableFields.length === 0" class="create-select__empty">
              No fields yet.
              <NuxtLink to="/fields/create" class="link">Create one</NuxtLink>
            </div>
            <template v-else>
              <AppInput v-model="fieldSearch" type="search" placeholder="Search fields..." />
              <div class="create-select__list">
                <div
                  v-for="f in filteredAvailable"
                  :key="f.id"
                  class="create-select__item"
                  :class="{ 'is-disabled': isSelected(f.id) }"
                  @click="addField(f)"
                >
                  <span class="material-icons-round create-select__type-icon">{{ typeIcon(f.type) }}</span>
                  <div>
                    <span class="create-select__name">{{ f.name }}</span>
                    <span class="create-select__sub">{{ f.type_label }}</span>
                  </div>
                  <span class="material-icons-round create-select__add-icon">{{ isSelected(f.id) ? 'check' : 'add' }}</span>
                </div>
              </div>
            </template>
          </div>

          <div class="fields-builder__selected">
            <p class="label01">Selected Fields <span class="optional">({{ selectedFields.length }})</span></p>
            <div v-if="selectedFields.length === 0" class="create-select__empty">
              Click fields on the left to add them.
            </div>
            <div v-else class="selected-fields-list">
              <div v-for="(sf, idx) in selectedFields" :key="sf.id" class="selected-field-row">
                <span class="selected-field-order">{{ idx + 1 }}</span>
                <div class="selected-field-info">
                  <span class="create-select__name">{{ sf.name }}</span>
                  <span class="create-select__sub">{{ sf.type_label }}</span>
                </div>
                <label class="selected-field-required">
                  <input v-model="sf.required" type="checkbox" class="input-checkbox" />
                  Required
                </label>
                <button type="button" class="file-remove-btn" @click="removeField(idx)">
                  <span class="material-icons-round">close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <div class="create-form__actions">
        <AppButton variant="ghost" to="/forms">Cancel</AppButton>
        <AppButton type="submit" :loading="loading">{{ isEdit ? 'Update Form' : 'Save Form' }}</AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!id.value && id.value !== 'create')

interface FieldOption {
  id: number
  name: string
  type: string
  type_label: string
}

interface SelectedField extends FieldOption {
  required: boolean
}

const TYPE_ICONS: Record<string, string> = {
  short_text: 'short_text',
  long_text: 'notes',
  numeric: 'pin',
  date: 'calendar_today',
  template_file: 'file_download',
  supplier_file: 'file_upload',
}

const form = reactive({ name: '', description: '', is_active: true })
const errors = reactive({ name: '', fields: '' })
const selectedFields = ref<SelectedField[]>([])
const availableFields = ref<FieldOption[]>([])
const fieldSearch = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const existingTemplate = ref<string | null>(null)
const removeTemplate = ref(false)
const toast = useAppToast()
const loadingFields = ref(true)
const loadingRecord = ref(false)
const loading = ref(false)

const filteredAvailable = computed(() => {
  if (!fieldSearch.value) return availableFields.value
  const q = fieldSearch.value.toLowerCase()
  return availableFields.value.filter(f => f.name.toLowerCase().includes(q))
})

onMounted(async () => {
  const api = useApi()

  // Load available fields
  try {
    const res = await api<{ data: FieldOption[] | { data: FieldOption[] } }>('/fields')
    const d = res.data
    availableFields.value = Array.isArray(d) ? d : d.data
  }
  catch { availableFields.value = [] }
  finally { loadingFields.value = false }

  // Load existing form if editing
  if (!isEdit.value) return
  loadingRecord.value = true
  try {
    const res = await api<{ data: Record<string, unknown> }>(`/forms/${id.value}`)
    const d = res.data
    form.name = d.name as string
    form.description = (d.description as string) ?? ''
    form.is_active = d.is_active as boolean
    existingTemplate.value = (d.template_file_name as string) ?? null

    const fields = d.fields as (FieldOption & { required: boolean, order: number })[] | undefined
    if (fields) {
      selectedFields.value = [...fields]
        .sort((a, b) => a.order - b.order)
        .map(f => ({ id: f.id, name: f.name, type: f.type, type_label: f.type_label, required: f.required }))
    }
  }
  catch (err) { toast.error(err, 'Could not load form data', { category: 'form' }) }
  finally { loadingRecord.value = false }
})

function typeIcon(type: string): string { return TYPE_ICONS[type] ?? 'input' }
function isSelected(id: number): boolean { return selectedFields.value.some(f => f.id === id) }
function addField(field: FieldOption) {
  if (isSelected(field.id)) return
  selectedFields.value.push({ ...field, required: false })
}
function removeField(idx: number) { selectedFields.value.splice(idx, 1) }
function onFileChange(e: Event) {
  selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}
function removeFile() {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function validate(): boolean {
  errors.name = ''
  errors.fields = ''
  let valid = true
  if (!form.name.trim()) { errors.name = 'Form name is required.'; valid = false }
  if (selectedFields.value.length === 0) { errors.fields = 'Add at least one field.'; valid = false }
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
    body.append('is_active', String(form.is_active))
    if (selectedFile.value) body.append('template_file', selectedFile.value)
    selectedFields.value.forEach((sf, idx) => {
      body.append(`fields[${idx}][id]`, String(sf.id))
      body.append(`fields[${idx}][order]`, String(idx))
      body.append(`fields[${idx}][required]`, String(sf.required))
    })

    if (isEdit.value) {
      // Laravel doesn't parse FormData on PATCH — spoof via POST
      body.append('_method', 'PATCH')
      if (removeTemplate.value) body.append('remove_template', 'true')
      await api(`/forms/${id.value}`, { method: 'POST', body })
      toast.success('Form updated', { category: 'form' })
    }
    else {
      await api('/forms', { method: 'POST', body })
      toast.success('Form created', { category: 'form' })
    }
    await navigateTo('/forms')
  }
  catch (err: unknown) {
    toast.error(err, isEdit.value ? 'Could not update form' : 'Could not create form', { category: 'form' })
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

.input-checkbox { margin-right: var(--space-2); cursor: pointer; }

.input-file { display: block; margin-top: var(--space-2); font-size: var(--text-sm); }

.file-selected {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-hover);
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
.file-remove-btn:hover { color: var(--color-danger); }

.fields-builder {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-2);
}
@media (max-width: 768px) { .fields-builder { grid-template-columns: 1fr; } }

.create-select__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
  max-height: 300px;
  overflow-y: auto;
}

.create-select__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}
.create-select__item:hover:not(.is-disabled) { background: var(--color-surface-hover); }
.create-select__item.is-disabled { opacity: 0.4; cursor: default; }

.create-select__type-icon { font-size: 18px; color: var(--color-text-muted); }
.create-select__add-icon { margin-left: auto; font-size: 18px; color: var(--color-text-muted); }
.create-select__name { font-size: var(--text-sm); font-weight: 500; display: block; }
.create-select__sub { font-size: var(--text-xs); color: var(--color-text-muted); display: block; }
.create-select__loading, .create-select__empty { font-size: var(--text-sm); color: var(--color-text-muted); padding: var(--space-3) 0; }
.link { color: var(--color-primary); text-decoration: underline; }

.selected-fields-list { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }

.selected-field-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
}

.selected-field-order { font-size: var(--text-sm); color: var(--color-text-muted); min-width: 18px; text-align: center; }
.selected-field-info { flex: 1; }
.selected-field-required {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  cursor: pointer;
}
</style>
