<template>
  <aside :class="['app-sidebar', { 'is-open': isOpen }]" aria-label="Main navigation">

    <div class="app-sidebar__logo">
      <NuxtLink :to="isMaster ? '/admin' : '/'" @click="emit('close')">
        <img src="/images/logo_cor.png" alt="Squirrel" />
      </NuxtLink>
    </div>

    <div class="app-sidebar__search">
      <AppSearch />
    </div>

    <nav class="app-sidebar__nav">
      <ul class="app-sidebar__list">

        <template v-if="isMaster">

          <li class="app-sidebar__home">
            <NuxtLink to="/admin" class="app-sidebar__link" @click="emit('close')">
              <span class="material-icons-round">home</span>
              Dashboard
            </NuxtLink>
            <hr class="app-sidebar__separator" />
          </li>
          <li>
            <NuxtLink to="/admin/companies" class="app-sidebar__link" @click="emit('close')">
              <span class="material-icons-round">factory</span>
              Companies
            </NuxtLink>
          </li>

          <li>
            <NuxtLink to="/admin/maintenance" class="app-sidebar__link" @click="emit('close')">
              <span class="material-icons-round">build</span>
              Maintenance
            </NuxtLink>
          </li>

        </template>

        <!-- ── Regular user nav ─────────────────────── -->
        <template v-else>

          <li class="app-sidebar__home">
            <NuxtLink to="/" class="app-sidebar__link" @click="emit('close')">
              <span class="material-icons-round">home</span>
              Dashboard
            </NuxtLink>
            <hr class="app-sidebar__separator" />
          </li>

          <li>
            <NuxtLink to="/requests" class="app-sidebar__link" @click="emit('close')">
              <span class="material-icons-round">description</span>
              Requests
            </NuxtLink>
          </li>

          <template v-if="!isSupplier">
            <li>
              <button class="app-sidebar__link app-sidebar__dropdown-toggle" :class="{ 'is-open': modelsOpen }"
                @click="modelsOpen = !modelsOpen">
                <span class="material-icons-round">format_list_bulleted</span>
                Models
              </button>
              <ul v-show="modelsOpen" class="app-sidebar__submenu">
                <li>
                  <NuxtLink to="/fields" class="app-sidebar__sublink" @click="emit('close')">Fields</NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/forms" class="app-sidebar__sublink" @click="emit('close')">Forms</NuxtLink>
                </li>
              </ul>
            </li>

            <li>
              <NuxtLink to="/suppliers" class="app-sidebar__link" @click="emit('close')">
                <span class="material-icons-round">local_shipping</span>
                Suppliers
              </NuxtLink>
            </li>

            <li v-if="!isCompanyUser">
              <NuxtLink to="/users" class="app-sidebar__link" @click="emit('close')">
                <span class="material-icons-round">person</span>
                Users
              </NuxtLink>
            </li>
          </template>

        </template>

      </ul>
    </nav>

    <div class="app-sidebar_footer">
      <template v-if="!isMaster">
        <NuxtLink to="/settings" class="app-sidebar__link" @click="emit('close')">
          <span class="material-icons-round">settings</span>
          Settings
        </NuxtLink>
      </template>
      <button class="app-sidebar__link" @click="onLogout">
        <span class="material-icons-round">logout</span>
        Logout
      </button>
    </div>

  </aside>
</template>

<script setup lang="ts">
defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const isMaster = computed(() => authStore.user?.roles === 'master')
const isCompanyUser = computed(() => authStore.user?.roles === 'company-user')
const isSupplier = computed(() => authStore.user?.roles === 'supplier')

const modelsOpen = ref(false)

function onLogout() {
  emit('close')
  authStore.logout()
  navigateTo('/login')
}
</script>
