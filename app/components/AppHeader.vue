<template>
  <header class="app-header">

    <NuxtLink to="/" class="app-header__logo" @click="emit('closeSidebar')">
      <span>Squirrel</span>
    </NuxtLink>

    <div class="app-header__search">
      <AppSearch />
    </div>

    <div class="app-header__actions">
      <div class="app-header__user" @click="emit('toggleUserMenu')">
        <div class="avatar">{{ initials }}</div>
        <span class="name">{{ user?.name ?? 'Account' }}</span>
      </div>
    </div>

    <button type="button" class="app-header__hamburger" :aria-label="sidebarOpen ? 'Close menu' : 'Open menu'" @click="emit('toggleSidebar')">
      <span class="material-icons-round">{{ sidebarOpen ? 'close' : 'menu' }}</span>
    </button>
    
  </header>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const user = computed(() => authStore.user as Record<string, string> | null)
const initials = computed(() => {
  const name = user.value?.name ?? ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'U'
})

defineProps<{ sidebarOpen?: boolean }>()

const emit = defineEmits<{
  toggleSidebar: []
  toggleUserMenu: []
  closeSidebar: []
}>()
</script>
