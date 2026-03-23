<template>
  <div>
    <div class="container">
      <div class="row">

        <!-- Breadcrumb -->
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests', to: '/requests' }, { label: requestTitle }]" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="col-12">
          <div class="list-empty">
            <span class="material-icons-round">hourglass_empty</span>
            <p>Loading...</p>
          </div>
        </div>

        <template v-else-if="entry">

          <!-- ── Left: form content ── -->
          <div class="col-12 col-md-7">
            <div class="entry-main">

              <h1 class="entry-main__title">{{ form?.name ?? entry.form.name }}</h1>

              <div class="entry-main__supplier">
                <span class="material-icons-round">local_shipping</span>
                {{ entry.supplier.name }}
              </div>

              <p v-if="form?.description" class="entry-main__description">{{ form.description }}</p>

              <!-- Template file download -->
              <div v-if="form?.has_template" class="entry-main__template">
                <span class="material-icons-round">attach_file</span>
                <a :href="`${apiBase}/forms/${entry.form.id}/template`" class="entry-main__download" target="_blank">
                  {{ form.template_file_name }}
                </a>
              </div>

              <!-- Form fields -->
              <div v-if="form?.fields?.length" class="entry-main__fields">
                <div v-for="field in form.fields" :key="field.id" class="entry-field">
                  <div class="entry-field__label">
                    {{ field.name }}
                    <span v-if="field.required" class="entry-field__required">*</span>
                  </div>
                  <p v-if="field.description" class="entry-field__description">{{ field.description }}</p>
                  <div class="entry-field__type">
                    <AppBadge variant="neutral">{{ field.type_label }}</AppBadge>
                    <AppBadge v-if="field.requires_file" variant="neutral">
                      <span class="material-icons-round" style="font-size:13px">attach_file</span>
                      File
                    </AppBadge>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- ── Right: status section ── -->
          <div class="col-12 col-md-5">
            <div class="entry-status">

              <!-- Status badge -->
              <div class="entry-status__badge" :data-status="entry.status.value">
                <span class="material-icons-round">{{ statusIcon(entry.status.value) }}</span>
                <p>{{ entry.status.label }}</p>
              </div>

              <!-- Status description -->
              <div class="entry-status__card">
                <div class="entry-status__card-header" :data-status="entry.status.value">
                  <span class="material-icons-round">{{ statusIcon(entry.status.value) }}</span>
                  <h4>{{ statusTitle(entry.status.value) }}</h4>
                </div>
                <p class="entry-status__card-text">{{ statusDescription(entry.status.value) }}</p>

                <!-- Approve / Reject — only for non-company-user when pending_approval -->
                <template v-if="entry.status.value === 'pending_approval' && !isCompanyUser">
                  <div class="entry-status__actions">
                    <AppButton variant="danger" :loading="rejecting" @click="onReject">
                      <span class="material-icons-round">highlight_off</span>
                      Reject
                    </AppButton>
                    <AppButton :loading="approving" @click="onApprove">
                      <span class="material-icons-round">check_circle</span>
                      Approve
                    </AppButton>
                  </div>
                </template>
              </div>

              <!-- Assigned to -->
              <div v-if="request?.assigned_to" class="entry-status__assigned">
                <span class="material-icons-round">account_circle</span>
                <div>
                  <p class="entry-status__assigned-label">Assigned to</p>
                  <p class="entry-status__assigned-name">{{ request.assigned_to.name }}</p>
                </div>
              </div>

            </div>
          </div>

        </template>

        <!-- Error state -->
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

interface RequestEntry {
  id: number
  supplier: { id: number; name: string; email: string }
  form: { id: number; name: string }
  status: { value: string; label: string }
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

const route = useRoute()
const api = useApi()
const toast = useAppToast()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const requestId = Number(route.params.id)
const entryId = Number(route.params.entryId)

const loading = ref(true)
const request = ref<RequestData | null>(null)
const entry = ref<RequestEntry | null>(null)
const form = ref<FormDetail | null>(null)
const approving = ref(false)
const rejecting = ref(false)

const apiBase = config.public.apiBase as string
const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')
const requestTitle = computed(() => request.value?.title ?? entry.value?.form.name ?? 'Request')

onMounted(async () => {
  try {
    const res = await api<{ data: RequestData }>(`/requests/${requestId}`)
    request.value = res.data

    // Find the specific entry across all form groups
    for (const formGroup of res.data.forms) {
      const found = formGroup.suppliers.find(s => s.id === entryId)
      if (found) {
        entry.value = found
        break
      }
    }

    if (!entry.value) return

    // Fetch form details (fields, description, template)
    const formRes = await api<{ data: FormDetail }>(`/forms/${entry.value.form.id}`)
    form.value = formRes.data
  }
  catch {
    toast.error(null, 'Failed to load entry', { category: 'request' })
  }
  finally {
    loading.value = false
  }
})

async function onApprove() {
  if (!entry.value) return
  approving.value = true
  try {
    await api(`/request-entries/${entry.value.id}/approve`, { method: 'POST' })
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
    await api(`/request-entries/${entry.value.id}/reject`, { method: 'POST' })
    entry.value.status = { value: 'awaiting_answer', label: 'Awaiting Answer' }
    toast.success('Entry rejected', { category: 'request' })
  }
  catch (err) {
    toast.error(err, 'Failed to reject entry', { category: 'request' })
  }
  finally { rejecting.value = false }
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
    pending_approval: 'Waiting for approval',
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

/* ── Main content ── */
.entry-main {
  padding: var(--space-6) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.entry-main__title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.entry-main__supplier {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.entry-main__supplier .material-icons-round {
  font-size: 18px;
}

.entry-main__description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.entry-main__template {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.entry-main__download {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}
.entry-main__download:hover { text-decoration: underline; }

/* Fields list */
.entry-main__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.entry-field {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.entry-field__label {
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

.entry-field__type {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* ── Status section ── */
.entry-status {
  padding: var(--space-6) 0 var(--space-6) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border-left: 1px solid var(--color-border);
  height: 100%;
}

@media (max-width: 1279px) {
  .entry-status {
    padding: var(--space-4) 0 0;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
}

.entry-status__badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}

.entry-status__badge[data-status="awaiting_answer"] { color: var(--color-yellow); }
.entry-status__badge[data-status="pending_approval"] { color: var(--color-primary); }
.entry-status__badge[data-status="completed"] { color: var(--color-green); }
.entry-status__badge[data-status="cancelled"] { color: var(--color-danger); }

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
  border-bottom: 1px solid var(--color-border);
}

.entry-status__card-header h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.entry-status__card-header[data-status="awaiting_answer"] { background: var(--color-surface-hover); }
.entry-status__card-header[data-status="pending_approval"] { background: var(--color-primary-subtle); }
.entry-status__card-header[data-status="completed"] { background: var(--color-surface-hover); }
.entry-status__card-header[data-status="cancelled"] { background: var(--color-danger-subtle); }

.entry-status__card-text {
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.entry-status__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}

.entry-status__assigned {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.entry-status__assigned .material-icons-round {
  font-size: 28px;
  color: var(--color-text-muted);
}

.entry-status__assigned-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.entry-status__assigned-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}
</style>
