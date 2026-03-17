<template>
  <header class="app-header">
    <button type="button" class="app-header__hamburger" aria-label="Open menu" @click="emit('toggleSidebar')">
      <span class="material-icons-round">menu</span>
    </button>

    <NuxtLink to="/" class="app-header__logo">
      <span>Squirrel</span>
    </NuxtLink>

    <div class="app-header__search">
      <input type="search" class="input-search" placeholder="Search..." />
    </div>

    <div class="app-header__actions">
      <div class="app-header__user" @click="emit('toggleUserMenu')">
        <div class="avatar">{{ initials }}</div>
        <span class="name">{{ user?.name ?? 'Account' }}</span>
      </div>
    </div>
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

const emit = defineEmits<{
  toggleSidebar: []
  toggleUserMenu: []
}>()
</script>
