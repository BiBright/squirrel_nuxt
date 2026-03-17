<template>
  <div class="app-layout">
    <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />
    <div
      class="sidebar-backdrop"
      :class="{ 'is-open': sidebarOpen }"
      @click="sidebarOpen = false"
    />
    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
</script>
