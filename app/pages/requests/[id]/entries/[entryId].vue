<template>
  <div>
    <div class="container">
      <div class="row">

        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests', to: '/requests' }, { label: requestTitle }]" />
        </div>

        <div v-if="loading" class="col-12">
          <div class="list-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading...</p>
          </div>
        </div>

        <template v-else-if="entry">

          <div class="col-12 col-md-7">
            <div class="entry-header">
              <h1 class="label-01">{{ form?.name ?? entry.form.name }}</h1>
            </div>

            <div class="request-entry-card">
              <AppCard>
                <div class="entry-supplier">
                  <span class="material-icons-round">local_shipping</span>
                  {{ entry.supplier.name }}
                </div>

                <p v-if="form?.description" class="entry-description">{{ form.description }}</p>

                <hr class="entry-divider">

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
                  <div v-for="field in form?.fields" :key="field.id" class="entry-field">
                    <div class="entry-field__name">
                      {{ field.name }}<span v-if="field.required" class="entry-field__required">*</span>
                    </div>
                    <p v-if="field.description" class="entry-field__description">{{ field.description }}</p>

                    <template v-if="field.requires_file">
                      <p v-if="field.template_file_name" class="entry-field__template-msg">
                        Download the statement and reattach it after filling it out
                        <a :href="`${apiBase}/fields/${field.id}/template`" class="entry-file-link" target="_blank">
                          {{ field.template_file_name }}
                        </a>
                      </p>
                      <div class="entry-field__upload">
                        <label :for="`file-${field.id}`" class="entry-upload-btn">
                          <span class="material-icons-round">attach_file</span>
                          Attach File
                        </label>
                        <input :id="`file-${field.id}`" type="file" class="entry-file-input"
                          @change="onFileChange(field.id, $event)">
                      </div>
                      <div v-if="uploadedFiles[field.id] || getAnswer(field.id)?.file_name" class="entry-file-uploaded">
                        <p class="label02">File uploaded</p>
                        <a :href="getAnswer(field.id)?.file_url ?? '#'" class="entry-file-link" target="_blank">
                          <span class="material-icons-round">file_download</span>
                          {{ uploadedFiles[field.id]?.name ?? getAnswer(field.id)?.file_name }}
                        </a>
                      </div>
                    </template>

                    <AppInput v-else v-model="answers[field.id]" :type="fieldInputType(field.type)"
                      :placeholder="fieldPlaceholder(field.type)" />
                  </div>
                </div>

                <div class="entry-actions">
                  <AppButton variant="ghost" to="/requests">Cancel</AppButton>
                  <AppButton :loading="saving" @click="onSave">Save</AppButton>
                </div>
              </AppCard>
            </div>
          </div>


          <div class="col-12 col-md-5">
            <div class="entry-status">
              <div class="entry-header__pill" :data-status="entry.status.value">
                <span class="material-icons-round">{{ statusIcon(entry.status.value) }}</span>
                {{ entry.status.label }}
              </div>

              <div class="entry-status__card">
                <div class="entry-status__card-header" :data-status="entry.status.value">
                  <span class="material-icons-round">{{ statusIcon(entry.status.value) }}</span>
                  <h4>{{ statusTitle(entry.status.value) }}</h4>
                </div>
                <div class="entry-status__card-body">
                  <p class="entry-status__card-text">{{ statusDescription(entry.status.value) }}</p>

                  <template v-if="entry.status.value === 'pending_approval' && !isCompanyUser">
                    <div class="entry-status__comments">
                      <label class="label01">
                        Comments <span class="entry-status__comments-hint">*Fill in if there is something wrong</span>
                      </label>
                      <textarea v-model="comment" class="entry-status__textarea" placeholder="Type your comment"
                        rows="6" />
                    </div>
                    <div class="entry-status__actions">
                      <AppButton variant="danger" :loading="rejecting" @click="onReject">
                        <span class="material-icons-round">highlight_off</span>
                        Rejected
                      </AppButton>
                      <AppButton :loading="approving" @click="onApprove">
                        <span class="material-icons-round">check_circle</span>
                        Approve
                      </AppButton>
                    </div>
                  </template>
                </div>
              </div>
              <div class="entry-status__assigned">
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

interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string }
  form: { id: number; name: string }
  status: { value: string; label: string }
  answers?: EntryAnswer[]
  created_at: string
  updated_at: string
}

interface RequestData {
  id: number
  title: string | null
  assigned_to: { id: number; name: string } | null
  forms: {
    form_id: number
    form_name: string
    suppliers: RequestEntry[]
  }[]
}

interface UserOption { id: number; name: string }

const route = useRoute()
const api = useApi()
const toast = useAppToast()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const requestId = Number(route.params.id)
const entryId = Number(route.params.entryId)

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
const availableUsers = ref<UserOption[]>([])
const selectedAssigneeId = ref<number | null>(null)
const assigneeOpen = ref(false)
const assigneeDropdownRef = ref<HTMLElement | null>(null)

const selectedAssigneeName = computed(() =>
  availableUsers.value.find(u => u.id === selectedAssigneeId.value)?.name ?? 'Select user'
)

onClickOutside(assigneeDropdownRef, () => { assigneeOpen.value = false })

async function selectAssignee(id: number | null) {
  selectedAssigneeId.value = id
  assigneeOpen.value = false
  await onAssigneeChange()
}

const apiBase = config.public.apiBase as string
const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')
const requestTitle = computed(() => request.value?.title ?? entry.value?.form.name ?? 'Request')

function getAnswer(fieldId: number): EntryAnswer | undefined {
  return entry.value?.answers?.find(a => a.field_id === fieldId)
}

onMounted(async () => {
  try {
    const [requestRes, usersRes] = await Promise.allSettled([
      api<{ data: RequestData }>(`/requests/${requestId}`),
      api<{ data: UserOption[] }>('/users'),
    ])

    if (usersRes.status === 'fulfilled') availableUsers.value = usersRes.value.data

    if (requestRes.status !== 'fulfilled') throw new Error('Failed to load request')
    request.value = requestRes.value.data
    selectedAssigneeId.value = requestRes.value.data.assigned_to?.id ?? null

    for (const formGroup of requestRes.value.data.forms) {
      const found = formGroup.suppliers.find(s => s.id === entryId)
      if (found) { entry.value = found; break }
    }

    if (!entry.value) return

    const formRes = await api<{ data: FormDetail }>(`/forms/${entry.value.form.id}`)
    form.value = formRes.data

    entry.value.answers?.forEach((a) => {
      if (a.value) answers[a.field_id] = a.value
    })
  }
  catch {
    toast.error(null, 'Failed to load entry', { category: 'request' })
  }
  finally {
    loading.value = false
  }
})

function onFileChange(fieldId: number, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) uploadedFiles[fieldId] = file
}

async function onAssigneeChange() {
  try {
    await api(`/requests/${requestId}`, {
      method: 'POST',
      body: { _method: 'PATCH', assigned_to: selectedAssigneeId.value ?? '' },
    })
    toast.success('Assignee updated', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to update assignee', { category: 'request' })
  }
}

async function onSave() {
  saving.value = true
  try {
    const body = new FormData()
    form.value?.fields.forEach((field) => {
      if (field.requires_file) {
        if (uploadedFiles[field.id]) body.append(`fields[${field.id}][file]`, uploadedFiles[field.id])
      }
      else {
        body.append(`fields[${field.id}][value]`, answers[field.id] ?? '')
      }
    })
    await api(`/entries/${entryId}/respond`, { method: 'POST', body })
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
  try {
    await api(`/request-entries/${entry.value.id}/approve`, { method: 'POST', body: { comment: comment.value } })
    entry.value.status = { value: 'completed', label: 'Completed' }
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
  try {
    await api(`/request-entries/${entry.value.id}/reject`, { method: 'POST', body: { comment: comment.value } })
    entry.value.status = { value: 'awaiting_answer', label: 'Awaiting Answer' }
    toast.success('Entry rejected', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to reject entry', { category: 'request' })
  }
  finally { rejecting.value = false }
}

function fieldInputType(type: string): string {
  const map: Record<string, string> = { numeric: 'number', date: 'date', long_text: 'textarea' }
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
  }
  return map[value] ?? 'help_outline'
}

function statusTitle(value: string): string {
  const map: Record<string, string> = {
    awaiting_answer: 'Waiting for an answer',
    pending_approval: 'This request is waiting for approval',
    completed: 'This request is complete',
    cancelled: 'This request was cancelled',
  }
  return map[value] ?? value
}

function statusDescription(value: string): string {
  const map: Record<string, string> = {
    awaiting_answer: 'Currently awaiting response from the supplier.',
    pending_approval: 'Confirm that all information provided aligns with the request requirements.',
    completed: 'This request is complete. Any modifications will revert it back to the Approval status.',
    cancelled: 'The request has been cancelled.',
  }
  return map[value] ?? ''
}
</script>

<style scoped>
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
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  width: fit-content;
  color: var(--color-white);
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

.entry-header__pill[data-status="cancelled"] {
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
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: var(--space-2);
}

.entry-supplier .material-icons-round {
  font-size: 18px;
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
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
}

.entry-file-link:hover {
  text-decoration: underline;
}

.entry-file-link .material-icons-round {
  font-size: 16px;
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

.entry-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary-25);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.entry-upload-btn:hover {
  background: var(--color-primary-subtle);
}

.entry-upload-btn .material-icons-round {
  font-size: 18px;
}

.entry-file-input {
  display: none;
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

.entry-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-2);
}

.entry-status {
  padding: 0 0 0 var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (max-width: 1279px) {
  .entry-status {
    padding: var(--space-4) 0 0;
    border-top: 1px solid var(--color-border);
  }
}

.entry-status__card {
  background: var(--color-surface);
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
.entry-status__card-header[data-status="awaiting_answer"] .material-icons-round {
  color: var(--color-yellow);
}

.entry-status__card-header[data-status="pending_approval"] h4,
.entry-status__card-header[data-status="pending_approval"] .material-icons-round {
  color: var(--color-primary);
}

.entry-status__card-header[data-status="completed"] h4,
.entry-status__card-header[data-status="completed"] .material-icons-round {
  color: var(--color-green);
}

.entry-status__card-header[data-status="cancelled"] h4,
.entry-status__card-header[data-status="cancelled"] .material-icons-round {
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
  color: var(--color-text-muted);
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
  border-top: 1px solid var(--color-border);
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
