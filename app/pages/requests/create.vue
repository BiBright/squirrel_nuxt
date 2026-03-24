<template>
  <div>
    <div class="container">
      <div class="row">

        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Requests', to: '/requests' }]" />
        </div>

        <div class="col-12">
          <AppPageHeader title="New Request" />
        </div>

        <div class="col-12">
          <form novalidate class="create-form" @submit.prevent="onSubmit">

            <AppCard>
              <div class="request-section">
                <div class="request-section__header">
                  <div>
                    <p class="label01">Add Forms</p>
                    <p class="label02">Each form added will create a new request with the form name.</p>
                  </div>
                  <button v-if="selectedForms.length > 0" type="button" class="remove-all-btn" @click="selectedForms = []">Remove all</button>
                </div>
                <p v-if="errors.form_ids" class="input-error-msg">{{ errors.form_ids }}</p>
                <div v-if="selectedForms.length > 0" class="selected-list">
                  <div v-for="f in selectedForms" :key="f.id" class="selected-row">
                    <span class="selected-row__name">{{ f.name }}</span>
                    <button type="button" class="selected-row__delete" @click="removeForm(f.id)">
                      <span class="material-icons-round">delete</span>
                    </button>
                  </div>
                </div>
                <AppButton type="button" @click="showFormsModal = true" variant= secondary>
                  <span class="material-icons-round">add</span> Add Forms
                </AppButton>
              </div>
            </AppCard>

            <AppCard>
              <div class="request-section">
                <div class="request-section__header">
                  <div>
                    <p class="label01">Add Suppliers</p>
                    <p class="label02">Each supplier added will have to answer the selected forms.<br>Please make sure to only select suppliers related to the forms added above.</p>
                  </div>
                  <button v-if="selectedSuppliers.length > 0" type="button" class="remove-all-btn" @click="selectedSuppliers = []">Remove all</button>
                </div>
                <p v-if="errors.supplier_ids" class="input-error-msg">{{ errors.supplier_ids }}</p>
                <div v-if="selectedSuppliers.length > 0" class="selected-list">
                  <div v-for="s in selectedSuppliers" :key="s.id" class="selected-row">
                    <span class="selected-row__name">{{ s.name }}</span>
                    <span class="selected-row__sub">{{ s.email }}</span>
                    <button type="button" class="selected-row__delete" @click="removeSupplier(s.id)">
                      <span class="material-icons-round">delete</span>
                    </button>
                  </div>
                </div>
                <AppButton type="button" @click="showSuppliersModal = true">
                  <span class="material-icons-round">add</span> Add Suppliers
                </AppButton>
              </div>
            </AppCard>

            <AppCard>
              <div class="request-section">
                <div class="request-section__header">
                  <p class="label01">Assignee User</p>
                </div>
                <p class="label02">Please select the person who will be responsible for this request.</p>
                <div v-if="assignee" class="selected-list">
                  <div class="selected-row">
                    <span class="selected-row__name">{{ assignee.name }}</span>
                    <button type="button" class="selected-row__delete" @click="assignee = null">
                      <span class="material-icons-round">delete</span>
                    </button>
                  </div>
                </div>
                <AppButton v-else type="button" @click="showUsersModal = true">
                  <span class="material-icons-round">add</span> Add User
                </AppButton>
              </div>
            </AppCard>

            <div class="create-form__actions">
              <AppButton variant="ghost" to="/requests">Cancel</AppButton>
              <AppButton type="submit" :loading="loading">Save</AppButton>
            </div>

          </form>
        </div>

      </div>
    </div>

  <AppModal v-model="showFormsModal" title="Add Forms" size="wide">
    <div v-if="loadingForms" class="modal-loading">Loading forms...</div>
    <div v-else-if="availableForms.length === 0" class="modal-empty">No active forms available.</div>
    <template v-else>
      <AppInput v-model="formSearch" type="search" placeholder="Search forms..." />
      <div class="modal-list">
        <div
          v-for="f in filteredForms"
          :key="f.id"
          class="modal-item"
          :class="{ 'is-selected': isFormSelected(f.id) }"
          @click="toggleForm(f)"
        >
          <span class="modal-item__name">{{ f.name }}</span>
          <span class="material-icons-round modal-item__action">{{ isFormSelected(f.id) ? 'check' : 'add' }}</span>
        </div>
      </div>
    </template>
    <template #footer>
      <AppButton @click="showFormsModal = false">Done</AppButton>
    </template>
  </AppModal>

  <AppModal v-model="showSuppliersModal" title="Add Suppliers" size="wide">
    <div v-if="loadingSuppliers" class="modal-loading">Loading suppliers...</div>
    <div v-else-if="availableSuppliers.length === 0" class="modal-empty">No suppliers registered yet.</div>
    <template v-else>
      <AppInput v-model="supplierSearch" type="search" placeholder="Search suppliers..." />
      <div class="modal-list">
        <div
          v-for="s in filteredSuppliers"
          :key="s.id"
          class="modal-item"
          :class="{ 'is-selected': isSupplierSelected(s.id) }"
          @click="toggleSupplier(s)"
        >
          <div class="modal-item__info">
            <span class="modal-item__name">{{ s.name }}</span>
            <span class="modal-item__sub">{{ s.email }}</span>
          </div>
          <span class="material-icons-round modal-item__action">{{ isSupplierSelected(s.id) ? 'check' : 'add' }}</span>
        </div>
      </div>
    </template>
    <template #footer>
      <AppButton @click="showSuppliersModal = false">Done</AppButton>
    </template>
  </AppModal>

  <!-- Users modal -->
  <AppModal v-model="showUsersModal" title="Add User" size="wide">
    <div v-if="loadingUsers" class="modal-loading">Loading users...</div>
    <div v-else-if="availableUsers.length === 0" class="modal-empty">No users available.</div>
    <template v-else>
      <AppInput v-model="userSearch" type="search" placeholder="Search users..." />
      <div class="modal-list">
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="modal-item"
          :class="{ 'is-selected': assignee?.id === u.id }"
          @click="selectUser(u)"
        >
          <span class="modal-item__name">{{ u.name }}</span>
          <span class="material-icons-round modal-item__action">{{ assignee?.id === u.id ? 'check' : 'add' }}</span>
        </div>
      </div>
    </template>
    <template #footer>
      <AppButton @click="showUsersModal = false">Done</AppButton>
    </template>
  </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface FormOption { id: number; name: string }
interface SupplierOption { id: number; name: string; email: string }
interface UserOption { id: number; name: string }

const errors = reactive({ form_ids: '', supplier_ids: '' })
const toast = useAppToast()
const loading = ref(false)

const availableForms = ref<FormOption[]>([])
const availableSuppliers = ref<SupplierOption[]>([])
const availableUsers = ref<UserOption[]>([])
const selectedForms = ref<FormOption[]>([])
const selectedSuppliers = ref<SupplierOption[]>([])
const assignee = ref<UserOption | null>(null)

const loadingForms = ref(true)
const loadingSuppliers = ref(true)
const loadingUsers = ref(true)
const showFormsModal = ref(false)
const showSuppliersModal = ref(false)
const showUsersModal = ref(false)

const formSearch = ref('')
const supplierSearch = ref('')
const userSearch = ref('')

const filteredForms = computed(() => {
  if (!formSearch.value) return availableForms.value
  const q = formSearch.value.toLowerCase()
  return availableForms.value.filter(f => f.name.toLowerCase().includes(q))
})

const filteredSuppliers = computed(() => {
  if (!supplierSearch.value) return availableSuppliers.value
  const q = supplierSearch.value.toLowerCase()
  return availableSuppliers.value.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
})

const filteredUsers = computed(() => {
  if (!userSearch.value) return availableUsers.value
  const q = userSearch.value.toLowerCase()
  return availableUsers.value.filter(u => u.name.toLowerCase().includes(q))
})

onMounted(async () => {
  const api = useApi()
  const [formsRes, suppliersRes, usersRes] = await Promise.allSettled([
    api<{ data: FormOption[] }>('/forms'),
    api<{ data: SupplierOption[] }>('/suppliers'),
    api<{ data: UserOption[] }>('/users'),
  ])
  if (formsRes.status === 'fulfilled') availableForms.value = formsRes.value.data
  if (suppliersRes.status === 'fulfilled') availableSuppliers.value = suppliersRes.value.data
  if (usersRes.status === 'fulfilled') availableUsers.value = usersRes.value.data
  loadingForms.value = false
  loadingSuppliers.value = false
  loadingUsers.value = false
})

function isFormSelected(id: number) { return selectedForms.value.some(f => f.id === id) }
function isSupplierSelected(id: number) { return selectedSuppliers.value.some(s => s.id === id) }

function toggleForm(f: FormOption) {
  if (isFormSelected(f.id)) {
    selectedForms.value = selectedForms.value.filter(x => x.id !== f.id)
  }
  else {
    selectedForms.value.push(f)
  }
}

function toggleSupplier(s: SupplierOption) {
  if (isSupplierSelected(s.id)) {
    selectedSuppliers.value = selectedSuppliers.value.filter(x => x.id !== s.id)
  }
  else {
    selectedSuppliers.value.push(s)
  }
}

function removeForm(id: number) { selectedForms.value = selectedForms.value.filter(f => f.id !== id) }
function removeSupplier(id: number) { selectedSuppliers.value = selectedSuppliers.value.filter(s => s.id !== id) }

function selectUser(u: UserOption) {
  assignee.value = u
  showUsersModal.value = false
}

function validate(): boolean {
  errors.form_ids = ''
  errors.supplier_ids = ''
  let valid = true
  if (selectedForms.value.length === 0) { errors.form_ids = 'Select at least one form.'; valid = false }
  if (selectedSuppliers.value.length === 0) { errors.supplier_ids = 'Select at least one supplier.'; valid = false }
  return valid
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    const api = useApi()
    await api('/requests', {
      method: 'POST',
      body: {
        form_ids: selectedForms.value.map(f => f.id),
        supplier_ids: selectedSuppliers.value.map(s => s.id),
        assigned_to: assignee.value?.id ?? null,
      },
    })
    toast.success('Request created', { category: 'request' })
    await navigateTo('/requests')
  }
  catch (err: unknown) {
    toast.error(err, 'Could not create request', { category: 'request' })
  }
  finally { loading.value = false }
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}


.request-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.request-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.remove-all-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-primary);
  padding: 0;
  white-space: nowrap;
}

.remove-all-btn:hover { text-decoration: underline; }

.selected-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.selected-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-black10);
  border-radius: var(--radius-md);
}

.selected-row__name {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}

.selected-row__sub {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.selected-row__delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 0;
}

.selected-row__delete:hover { color: var(--color-danger); }

/* Modal list */
.modal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
  max-height: 360px;
  overflow-y: auto;
}

.modal-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.modal-item:hover:not(.is-selected) { background: var(--color-surface-hover); }
.modal-item.is-selected { opacity: 0.5; cursor: default; }

.modal-item__info { flex: 1; }

.modal-item__name {
  font-size: var(--text-sm);
  font-weight: 500;
  display: block;
}

.modal-item__sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  display: block;
}

.modal-item__action {
  font-size: 18px;
  color: var(--color-text-muted);
  margin-left: auto;
}

.modal-loading,
.modal-empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  padding: var(--space-3) 0;
}
</style>
