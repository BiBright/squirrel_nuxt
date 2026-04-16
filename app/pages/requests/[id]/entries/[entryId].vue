<template>
  <div>
    <div class="container">
      <div class="row">

        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests', to: '/requests' }, { label: requestTitle }]" />
        </div>

        <div v-if="loading" class="col-12 col-md-7 entry-col-main">
          <div class="skeleton-form">
            <AppSkeleton width="55%" height="22px" />
            <AppSkeleton width="75%" height="13px" />
            <hr class="entry-divider">
            <div class="skeleton-field">
              <AppSkeleton width="28%" height="12px" />
              <AppSkeleton height="40px" />
            </div>
            <div class="skeleton-field">
              <AppSkeleton width="22%" height="12px" />
              <AppSkeleton height="40px" />
            </div>
            <div class="skeleton-field">
              <AppSkeleton width="35%" height="12px" />
              <AppSkeleton height="90px" />
            </div>
            <div class="skeleton-field">
              <AppSkeleton width="20%" height="12px" />
              <AppSkeleton height="40px" />
            </div>
          </div>
        </div>

        <template v-else-if="entry">

          <div class="col-12 col-md-7 entry-col-main">
            <div class="entry-header">
              <h1 class="label-01">{{ form?.name ?? entry.form.name }}</h1>
            </div>
          </div>

          <div v-if="!isSupplier || !isCompanyUser" class="col-12 col-md-5 entry-col-side">
            <div class="entry-header__pill" :data-status="entry.status.value">
              <span class="material-icons-outlined">{{ statusIcon(entry.status.value) }}</span>
              {{ entry.status.label }}
            </div>
          </div>

          <div class="col-12 col-md-7 entry-col-main entry-form-col">
            <div class="request-entry-card">
              <AppCard>
                <div v-if="entry.supplier?.name" class="entry-supplier">
                  <span class="material-icons-round">local_shipping</span>
                  {{ entry.supplier.name }}
                </div>
                
                <hr class="entry-divider">

                <div class="entry-form-info">
                  <h1 class="subtitle01">{{ form?.name ?? entry.form.name }}</h1>
                  <p v-if="form?.description" class="body01">{{ form.description }}</p>
                </div>

                <div v-if="form?.has_template" class="entry-attached-files">
                  <p class="label01">Attached Files</p>
                  <a :href="`${apiBase}/forms/${entry.form.id}/template`" class="entry-file-link" target="_blank"
                    download>
                    <span class="material-icons-round">file_download</span>
                    {{ form.template_file_name }}
                  </a>
                </div>

                <hr v-if="form?.has_template && form?.fields?.length" class="entry-divider">

                <div class="entry-fields">
                  <div v-for="field in form?.fields" :key="field.id" :data-field-id="field.id" class="entry-field">
                    <div class="entry-field__name">
                      {{ field.name }}<span v-if="field.required" class="entry-field__required">*</span>
                    </div>
                    <p v-if="field.description" class="entry-field__description">{{ field.description }}</p>

                    <template v-if="needsFile(field)">
                      <p v-if="field.template_file_name" class="entry-field__template-msg">
                        Download the statement and reattach it after filling it out
                        <a :href="`${apiBase}/fields/${field.id}/template`" class="entry-file-link" target="_blank">
                          {{ field.template_file_name }}
                        </a>
                      </p>
                      <div v-if="uploadedFiles[field.id] || getAnswer(field.id)?.file_name" class="entry-file-uploaded">
                        <p class="label02">File uploaded</p>
                        <button type="button" class="entry-file-link"
                          @click="downloadFile(getAnswer(field.id)?.file_url ?? '', uploadedFiles[field.id]?.name ?? getAnswer(field.id)?.file_name ?? 'file')">
                          <span class="material-icons-round">file_download</span>
                          {{ uploadedFiles[field.id]?.name ?? getAnswer(field.id)?.file_name }}
                        </button>
                      </div>
                      <div v-if="canEdit" class="entry-field__upload">
                        <AppFileUpload @change="onFileChange(field.id, $event)" />
                      </div>
                      <p v-else-if="!getAnswer(field.id)?.file_name" class="entry-field__description">No file uploaded yet.</p>
                    </template>

                    <AppInput v-else v-model="answers[field.id]" :type="fieldInputType(field.type)"
                      :placeholder="fieldPlaceholder(field.type)" :disabled="!canEdit" />

                    <p v-if="fieldErrors[field.id]" class="entry-field__error">{{ fieldErrors[field.id] }}</p>
                  </div>
                </div>


                <div v-if="canEdit" class="entry-actions">
                  <AppButton variant="ghost" to="/requests">Cancel</AppButton>
                  <AppButton :loading="saving" @click="onSave">Submit</AppButton>
                </div>
              </AppCard>
            </div>
          </div>

          <div v-if="!isSupplier || !isCompanyUser" class="col-12 col-md-5 entry-col-side">
            <div class="entry-status">
              <div class="entry-status__card">
                <div class="entry-status__card-header" :data-status="entry.status.value">
                  <span class="material-icons-outlined">{{ statusIcon(entry.status.value) }}</span>
                  <h4>{{ statusTitle(entry.status.value) }}</h4>
                </div>
                <div v-if="!isSupplier" class="entry-status__card-body">
                  <p class="entry-status__card-text">{{ statusDescription(entry.status.value) }}</p>

                  <template v-if="entry.status.value === 'pending_approval' && canEdit">
                    <div class="entry-status__comments">
                      <label class="label01">
                        Comments <span class="entry-status__comments-hint">*Fill in if there is something wrong</span>
                      </label>
                      <textarea v-model="comment" class="entry-status__textarea" placeholder="Type your comment"
                        rows="6" />
                    </div>
                    <div class="entry-status__actions">
                      <AppButton variant="danger" :loading="rejecting" @click="onReject">
                        <span class="material-icons-outlined">highlight_off</span>
                        Rejected
                      </AppButton>
                      <AppButton variant="success" :loading="approving" @click="onApprove">
                        <span class="material-icons-outlined">check_circle</span>
                        Approve
                      </AppButton>
                    </div>
                  </template>
                </div>
                <template v-if="entry.comments?.length">
                  <div class="entry-status__comments-list">
                    <p class="label01">Comments</p>
                    <div v-for="(c, i) in entry.comments" :key="i" class="entry-comment">
                      <div class="entry-comment__meta">
                        <span class="entry-comment__user">{{ c.user?.name ?? 'Unknown' }}</span>
                        <span class="entry-comment__date">{{ formatCommentDate(c.created_at) }}</span>
                      </div>
                      <p v-if="c.body" class="entry-comment__text">{{ c.body }}</p>
                    </div>
                  </div>
                </template>
              </div>

              <div v-if="!isSupplier && canEdit" class="entry-status__assigned">
                <p class="entry-status__assigned-label">Assigned to:</p>
                <div ref="assigneeDropdownRef" class="assignee-dropdown">
                  <button class="assignee-dropdown__trigger" type="button" @click="assigneeOpen = !assigneeOpen">
                    <span class="material-icons-round">account_circle</span>
                    <span class="assignee-dropdown__value">{{ selectedAssigneeName }}</span>
                    <span class="material-icons-round assignee-dropdown__chevron" :class="{ 'is-open': assigneeOpen }">expand_more</span>
                  </button>
                  <ul v-if="assigneeOpen" class="assignee-dropdown__menu">
                    <li class="assignee-dropdown__option" :class="{ 'is-active': selectedAssigneeId === null }" @click="selectAssignee(null)">Select user</li>
                    <li v-for="u in availableUsers" :key="u.id" class="assignee-dropdown__option" :class="{ 'is-active': selectedAssigneeId === u.id }" @click="selectAssignee(u.id)">{{ u.name }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="col-12">
          <div class="list-empty">
            <span class="material-icons-round">error_outline</span>
            <p>Entry not found.</p>
          </div>
        </div>

      </div>
    </div>
  </div>
  <AppUnsavedModal :model-value="showModal" @confirm="confirmLeave" @cancel="cancelLeave" />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Field {
  id: number
  name: string
  description: string | null
  type: string
  type_label: string
  requires_file: boolean
  template_file_name: string | null
  order: number
  required: boolean
}

interface FormDetail {
  id: number
  name: string
  description: string | null
  has_template: boolean
  template_file_name: string | null
  fields: Field[]
}

interface EntryAnswer {
  field_id: number
  value: string | null
  file_name: string | null
  file_url: string | null
}

interface EntryComment {
  id: number
  body: string | null
  created_at: string
  user: { id: number; name: string } | null
}

interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string } | null
  assigned_to: { id: number; name: string } | null
  form: { id: number; name: string; fields?: Field[] }
  status: { value: string; label: string }
  answers?: EntryAnswer[]
  comments?: EntryComment[]
  created_at: string
  updated_at: string
}

interface RequestData {
  id: number
  title: string | null
  assigned_to: { id: number; name: string } | null
  is_active?: boolean
  forms: {
    form_id: number
    form_name: string
    suppliers: RequestEntry[]
  }[]
}

interface UserOption { id: number; name: string }

interface SupplierEntryDetail {
  entry_id: number
  is_active?: boolean
  status: string
  request: { id: number; title: string | null; company: string; is_active?: boolean }
  form: {
    id: number
    name: string
    fields: { id: number; name: string; type: string; required: boolean; order: number }[]
  }
  responses: Record<string, { field_id: number; value: string | null; file_path: string | null; file_name: string | null }>
  comments?: EntryComment[]
}

const route = useRoute()
const api = useApi()
const toast = useAppToast()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const requestId = Number(route.params.id)
const entryId = Number(route.params.entryId)

const { isDirty, showModal, confirmLeave, cancelLeave } = useUnsavedChanges()

const _ready = ref(false)

const loading = ref(true)
const saving = ref(false)
const approving = ref(false)
const rejecting = ref(false)
const request = ref<RequestData | null>(null)
const entry = ref<RequestEntry | null>(null)
const form = ref<FormDetail | null>(null)
const comment = ref('')
const answers = reactive<Record<number, string>>({})
const uploadedFiles = reactive<Record<number, File>>({})

const formFields = computed(() => form.value?.fields ?? [])
const { fieldErrors, validate } = useFormValidation({
  fields: formFields,
  answers,
  uploadedFiles,
  getExistingFile: (fieldId) => getAnswer(fieldId)?.file_name,
  needsFile: needsFile as (field: { id: number; name: string; required: boolean }) => boolean,
})
const availableUsers = ref<UserOption[]>([])
const selectedAssigneeId = ref<number | null>(null)
const assigneeOpen = ref(false)
const assigneeDropdownRef = ref<HTMLElement | null>(null)

const selectedAssigneeName = computed(() =>
  availableUsers.value.find(u => u.id === selectedAssigneeId.value)?.name
  ?? entry.value?.assigned_to?.name
  ?? 'Select user'
)

onClickOutside(assigneeDropdownRef, () => { assigneeOpen.value = false })

watch(answers, () => { _ready.value && (isDirty.value = true) }, { deep: true })
watch(uploadedFiles, () => { _ready.value && (isDirty.value = true) }, { deep: true })
watch(comment, () => { isDirty.value = true })

async function selectAssignee(id: number | null) {
  selectedAssigneeId.value = id
  assigneeOpen.value = false
  await onAssigneeChange()
}

const apiBase = config.public.apiBase as string
const isSupplier = computed(() => authStore.user?.roles === 'supplier')
const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')
const requestTitle = computed(() => request.value?.title ?? entry.value?.form.name ?? 'Request')
const canEdit = computed(() => !route.query.inactive && request.value?.is_active !== false)

function getAnswer(fieldId: number): EntryAnswer | undefined {
  return entry.value?.answers?.find(a => a.field_id === fieldId)
}

function needsFile(field: Field): boolean {
  return field.requires_file || field.type === 'template_file' || field.type === 'supplier_file'
}

onMounted(async () => {
  // Clear stale answers from any previous navigation
  for (const key of Object.keys(answers)) delete answers[Number(key)]

  try {
    if (isSupplier.value) {
      const res = await api<{ data: SupplierEntryDetail }>(`/supplier/request/${requestId}`)

      request.value = {
        id: res.data.request.id,
        title: res.data.request.title,
        assigned_to: null,
        is_active: res.data.is_active ?? res.data.request.is_active,
        forms: [],
      }

      const statusLabel = res.data.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      entry.value = {
        id: res.data.entry_id,
        supplier: authStore.user
          ? { id: authStore.user.id as number, name: authStore.user.name as string, email: authStore.user.email as string ?? '' }
          : null,
        assigned_to: null,
        form: { id: res.data.form.id, name: res.data.form.name },
        status: { value: res.data.status, label: statusLabel },
        created_at: '',
        updated_at: '',
        answers: Object.values(res.data.responses).map(r => ({
          field_id: r.field_id,
          value: r.value,
          file_name: r.file_name,
          file_url: null,
        })),
      }

      if (res.data.comments?.length) entry.value.comments = res.data.comments

      form.value = {
        id: res.data.form.id,
        name: res.data.form.name,
        description: null,
        has_template: false,
        template_file_name: null,
        fields: res.data.form.fields.map(f => ({
          id: f.id,
          name: f.name,
          description: null,
          type: f.type,
          type_label: f.type,
          requires_file: false,
          template_file_name: null,
          order: f.order,
          required: f.required,
        })),
      }
    }
    else {
      const requestRes = await api<{ data: RequestData }>(`/requests/${requestId}`)
      request.value = requestRes.data

      for (const formGroup of requestRes.data.forms) {
        const found = formGroup.suppliers.find((s: RequestEntry) => s.id === entryId)
        if (found) { entry.value = found; break }
      }

      selectedAssigneeId.value = entry.value?.assigned_to?.id ?? null

      if (!entry.value) return

      const [formRes, usersRes, entryDetailRes] = await Promise.allSettled([
        api<{ data: FormDetail }>(`/forms/${entry.value.form.id}`),
        api<{ data: UserOption[] }>('/users'),
        api<{ data: { responses: { field_id: number; value: string | null; file_name: string | null; file_path: string | null }[]; comments?: EntryComment[] } }>(`/request-entries/${entryId}`),
      ])
      if (formRes.status === 'fulfilled') {
        form.value = formRes.value.data
      }
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data
        availableUsers.value = Array.isArray(d) ? d : (d as unknown as { data: UserOption[] }).data ?? []
      }
      if (entryDetailRes.status === 'fulfilled') {
        const rawResponses = entryDetailRes.value.data.responses
        const responsesArr = Array.isArray(rawResponses) ? rawResponses : Object.values(rawResponses as Record<string, { field_id: number; value: string | null; file_name: string | null; file_path: string | null }>)
        entry.value.answers = responsesArr.map(r => ({
          field_id: r.field_id,
          value: r.value,
          file_name: r.file_name,
          file_url: r.file_path,
        }))
        if (entryDetailRes.value.data.comments) {
          entry.value.comments = entryDetailRes.value.data.comments
        }
      }
    }

    entry.value?.answers?.forEach((a) => {
      if (a.value) answers[a.field_id] = a.value
    })

  }
  catch {
    toast.error(null, 'Failed to load entry', { category: 'request' })
  }
  finally {
    loading.value = false
    nextTick(() => { _ready.value = true })
  }
})

function onFileChange(fieldId: number, file: File) {
  uploadedFiles[fieldId] = file
}

async function downloadFile(url: string, fileName: string) {
  if (!url) return
  const token = decodeURIComponent(
    document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '',
  )
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'X-XSRF-TOKEN': token },
  })
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName
  a.click()
  URL.revokeObjectURL(blobUrl)
}

async function onAssigneeChange() {
  if (!entry.value?.supplier) return
  try {
    await api(`/requests/${requestId}/assign`, {
      method: 'PATCH',
      body: {
        assignments: [{
          form_id: entry.value.form.id,
          supplier_id: entry.value.supplier.id,
          assigned_to: selectedAssigneeId.value,
        }],
      },
    })
    toast.success('Assignee updated', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to update assignee', { category: 'request' })
  }
}

async function onSave() {
  if (!entry.value) return
  if (!validate()) return
  saving.value = true
  try {
    const body = new FormData()
    form.value?.fields.forEach((field, index) => {
      body.append(`responses[${index}][field_id]`, String(field.id))
      if (needsFile(field)) {
        if (uploadedFiles[field.id]) body.append(`responses[${index}][file]`, uploadedFiles[field.id]!)
      }
      else {
        body.append(`responses[${index}][value]`, answers[field.id] ?? '')
      }
    })
    await api(`/request-entries/${entryId}/respond`, { method: 'POST', body })
    const submitRes = await api<{ data: { status: { value: string; label: string } } }>(`/request-entries/${entryId}/submit`, { method: 'POST' })
    if (submitRes.data?.status) entry.value.status = submitRes.data.status
    isDirty.value = false
    toast.success('Entry saved', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to save entry', { category: 'request' })
  }
  finally { saving.value = false }
}

async function onApprove() {
  if (!entry.value) return
  approving.value = true
  console.log('[onApprove] sending comment:', comment.value)
  try {
    const res = await api<{ data: { status: { value: string; label: string }; comments?: EntryComment[] } }>(`/request-entries/${entry.value.id}/approve`, { method: 'POST', body: { comment: comment.value } })
    if (res.data?.status) entry.value.status = res.data.status
    if (res.data?.comments) entry.value.comments = res.data.comments
    comment.value = ''
    isDirty.value = false
    toast.success('Entry approved', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to approve entry', { category: 'request' })
  }
  finally { approving.value = false }
}

async function onReject() {
  if (!entry.value) return
  rejecting.value = true
  console.log('[onReject] sending comment:', comment.value)
  try {
    const res = await api<{ data: { status: { value: string; label: string }; comments?: EntryComment[] } }>(`/request-entries/${entry.value.id}/reject`, { method: 'POST', body: { comment: comment.value } })
    if (res.data?.status) entry.value.status = res.data.status
    if (res.data?.comments) entry.value.comments = res.data.comments
    comment.value = ''
    isDirty.value = false
    toast.success('Entry rejected', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to reject entry', { category: 'request' })
  }
  finally { rejecting.value = false }
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fieldInputType(type: string): 'number' | 'text' | 'date' | 'textarea' {
  const map: Record<string, 'number' | 'text' | 'date' | 'textarea'> = { numeric: 'number', date: 'date', long_text: 'textarea', short_text: 'text' }
  return map[type] ?? 'text'
}

function fieldPlaceholder(type: string): string {
  const map: Record<string, string> = {
    short_text: 'Enter text...',
    long_text: 'Enter text...',
    numeric: 'Enter number...',
    date: '',
  }
  return map[type] ?? ''
}

function statusIcon(value: string): string {
  const map: Record<string, string> = {
    awaiting_answer: 'schedule',
    pending_approval: 'pending',
    completed: 'check_circle',
    cancelled: 'highlight_off',
    rejected: 'highlight_off',
  }
  return map[value] ?? 'help_outline'
}

function statusTitle(value: string): string {
  const map: Record<string, string> = {
    awaiting_answer: 'Waiting for an answer',
    pending_approval: 'This request is waiting for approval',
    completed: 'This request is complete',
    cancelled: 'This request was cancelled',
    rejected: 'This request was rejected',
  }
  return map[value] ?? value
}

function statusDescription(value: string): string {
  const map: Record<string, string> = {
    awaiting_answer: 'Currently awaiting response from the supplier.',
    pending_approval: 'Confirm that all information provided aligns with the request requirements.',
    completed: 'This request is complete. Any modifications will revert it back to the Approval status.',
    cancelled: 'The request has been cancelled.',
    rejected: 'The submission was rejected. It can be revised and resubmitted.',
  }
  return map[value] ?? ''
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/base/variables' as *;

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.entry-header__title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
}

.entry-header__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  width: fit-content;
  color: var(--color-white);
  margin-bottom: var(--space-4);
}

.entry-header__pill[data-status="awaiting_answer"] {
  background: var(--color-yellow);
}

.entry-header__pill[data-status="pending_approval"] {
  background: var(--color-primary);
}

.entry-header__pill[data-status="completed"] {
  background: var(--color-green);
}

.entry-header__pill[data-status="cancelled"],
.entry-header__pill[data-status="rejected"] {
  background: var(--color-red);
}

.request-entry-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.entry-supplier {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-black80);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: var(--space-8);
}

.entry-supplier .material-icons-round {
  font-size: 18px;
}

.entry-form-info {
  display: grid;
  gap: 12px;
  margin: 36px 0 16px;
}

.entry-description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.entry-attached-files {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.entry-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-2) 0;
}

.entry-file-link {
  padding: 0;
  background: none;
  border: none;
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
}

.entry-file-link .material-icons-round {
  font-size: 18px;
}

.entry-fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.entry-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.entry-field__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.entry-field__required {
  color: var(--color-danger);
  margin-left: 2px;
}

.entry-field__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: 2px;
}

.entry-field__description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.entry-field__template-msg {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.entry-field__upload {
  display: flex;
  align-items: center;
}


.entry-file-uploaded {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.label02 {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.entry-status__comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
}

.entry-comment {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.entry-comment__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.entry-comment__user {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text);
}

.entry-comment__action {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;

  &[data-action="approved"] { color: var(--color-green); }
  &[data-action="rejected"] { color: var(--color-danger); }
}

.entry-comment__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.entry-comment__text {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.5;
}

.entry-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-2);
}

.entry-form-col {
  order: 1;
}

@media (min-width: 768px) {
  .entry-form-col {
    order: initial;
  }
}

@media (min-width: $bp-md) {
  .entry-col-main { width: 58.3333%; flex: 0 0 auto; }
  .entry-col-side { width: 41.6667%; flex: 0 0 auto; }
}

.entry-status {
  padding: 0;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 1280px) {
  .entry-status {
    border-top: none;
  }
}

.entry-status__card {
  background: var(--color-white60);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.entry-status__card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
}

.entry-status__card-header h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.entry-status__card-header[data-status="awaiting_answer"] h4,
.entry-status__card-header[data-status="awaiting_answer"] .material-icons-outlined {
  color: var(--color-yellow);
}

.entry-status__card-header[data-status="pending_approval"] h4,
.entry-status__card-header[data-status="pending_approval"] .material-icons-outlined {
  color: var(--color-primary);
}

.entry-status__card-header[data-status="completed"] h4,
.entry-status__card-header[data-status="completed"] .material-icons-outlined {
  color: var(--color-green);
}

.entry-status__card-header[data-status="cancelled"] h4,
.entry-status__card-header[data-status="cancelled"] .material-icons-outlined,
.entry-status__card-header[data-status="rejected"] h4,
.entry-status__card-header[data-status="rejected"] .material-icons-outlined {
  color: var(--color-danger);
}

.entry-status__card-body {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.entry-status__card-text {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.6;
}

.entry-status__comments {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.entry-status__comments-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 400;
  margin-left: var(--space-1);
}

.entry-status__textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.entry-status__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.entry-status__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-2);
}

.entry-status__assigned {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.entry-status__assigned-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.assignee-dropdown {
  position: relative;
}

.assignee-dropdown__trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  color: var(--color-text);
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;

  .material-icons-round { font-size: 20px; color: var(--color-text-muted); flex-shrink: 0; }
}

.assignee-dropdown__value {
  flex: 1;
}

.assignee-dropdown__chevron {
  transition: transform 0.15s;
  &.is-open { transform: rotate(180deg); }
}

.assignee-dropdown__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  list-style: none;
  padding: var(--space-1) 0;
  margin: 0;
  z-index: 10;
}

.assignee-dropdown__option {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &:hover { background: var(--color-surface-hover); }
  &.is-active { color: var(--color-primary); font-weight: 700; }
}
</style>
