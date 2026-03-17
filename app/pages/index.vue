<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="title01 page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">Welcome back, {{ userName }}</p>
      </div>
    </div>

    <div class="dashboard">
      <div class="dashboard__stats">
        <div v-for="stat in stats" :key="stat.label" class="dashboard__stat-card">
          <p class="stat-label">{{ stat.label }}</p>
          <p class="stat-value">{{ stat.value }}</p>
          <p v-if="stat.trend" class="stat-trend">{{ stat.trend }}</p>
        </div>
      </div>

      <div class="dashboard__section">
        <div class="dashboard__section-header">
          <h2 class="dashboard__section-title">Recent Orders</h2>
          <AppButton variant="ghost" to="/requests">
            View all
          </AppButton>
        </div>

        <div class="card">
          <div class="card__body">
            <p class="text-muted body01">No recent orders to display.</p>
          </div>
        </div>
      </div>

      <div class="dashboard__section">
        <div class="dashboard__section-header">
          <h2 class="dashboard__section-title">Suppliers</h2>
          <AppButton variant="ghost" to="/suppliers">
            View all
          </AppButton>
        </div>

        <div class="card">
          <div class="card__body">
            <p class="text-muted body01">No suppliers registered yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const userName = computed(() => {
  const user = authStore.user as Record<string, string> | null
  return user?.name ?? 'there'
})

const stats = [
  { label: 'Total Suppliers', value: '0',   trend: null },
  { label: 'Active Orders',   value: '0',   trend: null },
  { label: 'Pending Reviews', value: '0',   trend: null },
  { label: 'Active Users',    value: '0',   trend: null },
]
</script>
