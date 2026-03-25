<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Models' }, { label: 'Forms', to: '/forms' }]" />
        </div>

        <div class="col-12">
          <AppPageHeader :title="isEdit ? 'Edit Form' : 'New Form'" />
        </div>

        <div class="col-12">
          <div v-if="loadingRecord" class="list-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading form...</p>
          </div>

          <form v-else novalidate class="create-form" @submit.prevent="onSubmit">
            <div class="col-10">
            <AppCard>
              <AppInput v-model="form.name" label="Title" placeholder="e.g. Supplier Qualification Form"
                :error="errors.name" />
              <AppInput v-model="form.description" label="Description" type="textarea"
                placeholder="Optional description" :optional="true" />

              <div class="form-group">
                <label class="label01">Attach File <span class="optional">(optional)</span></label>
                <p class="label02">Insert here the template file, if needed.</p>

                <div v-if="isEdit && existingTemplate && !removeTemplate" class="file-selected">
                  <span class="material-icons-round">attach_file</span>
                  {{ existingTemplate }}
                  <button type="button" class="file-remove-btn" @click="removeTemplate = true">
                    <span class="material-icons-round">close</span>
                  </button>
                </div>

                <p v-else-if="isEdit && removeTemplate" class="label02" style="color: var(--color-danger)">
                  Template will be removed on save.
                  <button type="button" class="link"
                    style="background:none;border:none;cursor:pointer;color:var(--color-primary)"
                    @click="removeTemplate = false">Undo</button>
                </p>

                <div v-if="selectedFile" class="file-selected">
                  <span class="material-icons-round">attach_file</span>
                  {{ selectedFile.name }}
                  <button type="button" class="file-remove-btn" @click="removeFile">
                    <span class="material-icons-round">close</span>
                  </button>
                </div>
                <template v-else>
                  <label for="form-file-input" class="attach-btn">
                    <span class="material-icons-round">attach_file</span>
                    Attach File
                  </label>
                  <input id="form-file-input" ref="fileInput" type="file" class="input-file" accept=".pdf,.doc,.docx,.xls,.xlsx" @change="onFileChange">
                </template>
              </div>

              <!-- <div class="form-group">
                <label class="label01">
                  <input v-model="form.is_active" type="checkbox" class="input-checkbox" />
                  Active
                </label>
              </div> -->

              <div class="fields-section-header">
                <label class="label01">Add Fields</label>
                <button v-if="selectedFields.length > 0" type="button" class="remove-all-btn" @click="selectedFields = []">Remove all</button>
              </div>

              <p v-if="errors.fields" class="input-error-msg">{{ errors.fields }}</p>

              <div v-if="selectedFields.length > 0" class="fields-list">
                <div v-for="(sf, idx) in selectedFields" :key="sf.id" class="field-row">
                  <span class="field-row__name">{{ sf.name }}</span>
                  <span class="field-row__type">{{ sf.type_label }}</span>
                  <button type="button" class="field-row__delete" @click="removeField(idx)">
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>

              <AppButton type="button" @click="showFieldModal = true">
                <span class="material-icons-round">add</span> Add Field
              </AppButton>
            </AppCard>

            <AppModal v-model="showFieldModal" title="Add Fields" size="wide">
              <div v-if="loadingFields" class="create-select__loading">Loading fields...</div>
              <div v-else-if="availableFields.length === 0" class="create-select__empty">
                No fields yet.
                <NuxtLink to="/fields/create" class="link">Create one</NuxtLink>
              </div>
              <template v-else>
                <AppInput v-model="fieldSearch" type="search" placeholder="Search fields..." />
                <div class="modal-field-list">
                  <div v-for="f in filteredAvailable" :key="f.id" class="modal-field-item"
                    :class="{ 'is-selected': isSelected(f.id) }" @click="addField(f)">
                    <span class="material-icons-round modal-field-item__icon">{{ typeIcon(f.type) }}</span>
                    <div class="modal-field-item__info">
                      <span class="create-select__name">{{ f.name }}</span>
                      <span class="create-select__sub">{{ f.type_label }}</span>
                    </div>
                    <span class="material-icons-round modal-field-item__action">{{ isSelected(f.id) ? 'check' : 'add' }}</span>
                  </div>
                </div>
              </template>
              <template #footer>
                <AppButton @click="showFieldModal = false">Done</AppButton>
              </template>
            </AppModal>
            </div>

            <div class="create-form__actions">
              <AppButton variant="ghost" to="/forms">Cancel</AppButton>
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
const showFieldModal = ref(false)

const filteredAvailable = computed(() => {
  if (!fieldSearch.value) return availableFields.value
  const q = fieldSearch.value.toLowerCase()
  return availableFields.value.filter(f => f.name.toLowerCase().includes(q))
})

onMounted(async () => {
  const api = useApi()

  try {
    const res = await api<{ data: FieldOption[] | { data: FieldOption[] } }>('/fields')
    const d = res.data
    console.log(d);
    availableFields.value = Array.isArray(d) ? d : d.data
  }
  catch { availableFields.value = [] }
  finally { loadingFields.value = false }

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

.input-file {
  display: none;
}

.attach-btn {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary-25);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
}

.attach-btn:hover {
  background: var(--color-primary-subtle);
}

.attach-btn .material-icons-round {
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

.fields-section-header {
  margin-bottom: var(--space-6);
}

.remove-all-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-primary);
  padding: 0;
}

.remove-all-btn:hover {
  text-decoration: underline;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.field-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-black10);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
}

.field-row:hover {
  background-color: var(--color-white60);
}

.field-row__name {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}

.field-row__type {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.field-row__delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 0;
}

.modal-field-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
  max-height: 360px;
  overflow-y: auto;
}

.modal-field-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}

.modal-field-item:hover:not(.is-selected) {
  background: var(--color-surface-hover);
}

.modal-field-item.is-selected {
  opacity: 0.5;
  cursor: default;
}

.modal-field-item__icon {
  font-size: 18px;
  color: var(--color-text-muted);
}

.modal-field-item__info {
  flex: 1;
}

.modal-field-item__action {
  font-size: 18px;
  color: var(--color-text-muted);
}

.create-select__name {
  font-size: var(--text-sm);
  font-weight: 500;
  display: block;
}

.create-select__sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  display: block;
}

.create-select__loading,
.create-select__empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  padding: var(--space-3) 0;
}

.link {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
