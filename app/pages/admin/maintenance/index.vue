<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <AppBreadcrumb :items="[{ label: 'Maintenance' }]" />
      </div>

      <div class="col-12">
        <AppPageHeader title="Maintenance Mode" />
      </div>

      <div class="col-12">
        <AppCard>
          <div class="maintenance-status-row" :class="maintenanceOn ? 'maintenance-status-row--danger' : 'text-success'">
            <div class="d-flex">
              <p class="title03" :class="maintenanceOn ? 'text-danger' : 'text-success'">
                Platform is currently {{ maintenanceOn ? 'Offline' : 'Online' }}
              </p>
            </div>
          </div>


          <div class="maintenance-toggle-row">
            <div class="maintenance-title-contain">
              <span class="material-icons-round">
                engineering
              </span>
              <p class="maintenance-title">Maintenance Mode</p>
            </div>
            <label class="toggle-switch">
              <input :key="checkboxKey" :checked="maintenanceOn" type="checkbox" @change="onToggleRequest" />
              <span class="toggle-switch__track" />
            </label>
          </div>

          <p class="maintenance-label-activate">*When you activate maintenance mode, the platform will go offline until you deactivate it.</p>

        </AppCard>
      </div>
    </div>
  </div>

  <AppModal
    v-model="showConfirm"
    icon="warning"
    variant="danger"
    size="narrow"
    :closable="false"
    :close-on-overlay="false"
    :confirm-label="pendingValue ? 'Activate' : 'Deactivate'"
    cancel-label="Cancel"
    confirm-variant="primary"
    :confirm-loading="loading"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <p class="maintenance-modal__message">
      {{ pendingValue
        ? 'It seems that you are trying to activate maintenance mode. If you do this, the platform will go offline.'
        : 'It seems that you are trying to deactivate maintenance mode. If you do this, the platform will go online.' }}
    </p>
  </AppModal>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useAppToast()
const maintenanceOn = ref(false)
const showConfirm = ref(false)
const pendingValue = ref(false)
const loading = ref(false)
const checkboxKey = ref(0)

function onToggleRequest(e: Event) {
  pendingValue.value = (e.target as HTMLInputElement).checked
  showConfirm.value = true
}

function onCancel() {
  showConfirm.value = false
  checkboxKey.value++
}

async function onConfirm() {
  loading.value = true
  try {
    const api = useApi()
    await api('/master/maintenancestatus', { method: 'PATCH' })
    maintenanceOn.value = pendingValue.value
    showConfirm.value = false
  }
  catch (err) {
    toast.error(err, 'Could not update maintenance status', { category: 'general' })
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped>
.maintenance-status-row {
  background-color: var(--color-green-25);
  display: flex;
  padding: var(--space-3);
  border-radius: var(--space-1);
  border: 1px solid var(--color-green);
  align-items: center;

  p {
    margin: 0;
  }
}

.maintenance-status-row--danger {
  background-color: var(--color-red-25);
  border-color: var(--color-red);
}

.maintenance-title-contain {
  display: flex;
  gap: var(--space-3);
}

.maintenance-status-icon {
  font-size: 36px;
}

.maintenance-toggle-row {
  background-color: var(--color-white);
  border: 1px solid var(--color-white20);
  margin-top: var(--space-8);
  padding: var(--space-5);
  border-radius: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.maintenance-label-activate {
  margin-top: var(--space-2);
  font-size: 12px;
}

.maintenance-modal__message {
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}
</style>
