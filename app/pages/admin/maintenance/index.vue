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
      <div class="maintenance-status-row" :class="maintenanceOn ? 'text-danger' : 'text-success'">
        <div class="d-flex">
          <p class="title03" :class="maintenanceOn ? 'text-danger' : 'text-success'">
            Platform is currently {{ maintenanceOn ? 'Offline' : 'Online' }}
          </p>
        </div>
      </div>

      <hr class="maintenance-divider" />

      <div class="maintenance-toggle-row">
        <div>
          <p class="label01">Maintenance Mode</p>
          <p class="label02">When active, the platform will be unavailable to all users until you deactivate it.</p>
        </div>
        <label class="toggle-switch">
          <input v-model="maintenanceOn" type="checkbox" @change="onToggle" />
          <span class="toggle-switch__track" />
        </label>
      </div>

      <div v-if="maintenanceOn" class="login-error" style="margin-top: 20px; margin-bottom: 0;">
        <span class="material-icons-round">warning</span>
        The platform is currently offline. Users cannot log in or access any features.
      </div>
    </AppCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const maintenanceOn = ref(false)

function onToggle() {
  // TODO: PATCH /master/maintenancestatus
}
</script>

<style scoped>
.maintenance-status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 4px;

  p { margin: 0; }
}

.maintenance-status-icon {
  font-size: 36px;
}

.maintenance-divider {
  border: none;
  border-top: 1px solid var(--color-white40);
  margin: 20px 0;
}

.maintenance-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
</style>
