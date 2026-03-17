<template>
  <div>
    <AppPageHeader title="Users" subtitle="Manage team members and access" />

    <AppListToolbar
      v-model:search="search"
      v-model:sort="sort"
      v-model:view="view"
      label="user"
      add-label="Create User"
      :total-count="filtered.length"
      :selected-count="selectedCount"
      @add="onAdd"
      @delete="onDelete"
    />

    <div v-if="loading" class="list-container">
      <div class="list-empty">
        <span class="material-icons-round">hourglass_empty</span>
        <p>Loading users...</p>
      </div>
    </div>

    <template v-else-if="view === 'list'">
      <AppTable
        :columns="columns"
        :rows="tableRows"
        :button-delete="true"
        @delete="onDeleteRow"
        @select="onSelect"
      >
        <template #cell-name="{ value, row }">
          <NuxtLink :to="`/users/${row._raw.id}`" class="app-table__cell-link">{{ value }}</NuxtLink>
          <span class="app-table__cell-sub">{{ row.email }}</span>
        </template>

        <template #cell-role="{ value }">
          <AppBadge :variant="roleVariant(value as string)">{{ value }}</AppBadge>
        </template>

        <template #empty>
          <span class="material-icons-round">person_off</span>
          <p>No users found.</p>
        </template>
      </AppTable>
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div v-if="filtered.length === 0" class="list-container">
        <div class="list-empty">
          <span class="material-icons-round">person_off</span>
          <p>No users found.</p>
        </div>
      </div>

      <div v-else class="list-mosaic">
        <div v-for="user in filtered" :key="user.id" class="list-card">
          <div class="list-card__header">
            <NuxtLink :to="`/users/${user.id}`" class="list-card__title">{{ user.name }}</NuxtLink>
          </div>
          <div class="list-card__meta">
            <div class="list-card__meta-row">
              <span class="material-icons-round">email</span>
              {{ user.email }}
            </div>
            <div class="list-card__meta-row">
              <span class="material-icons-round">badge</span>
              {{ user.roles ?? '—' }}
            </div>
          </div>
          <div class="list-card__footer">
            <AppBadge :variant="roleVariant(user.roles ?? '')">{{ user.roles ?? 'No role' }}</AppBadge>
          </div>
        </div>
      </div>
    </template>

    <AppPagination :page="page" :last-page="lastPage" :total="total" @go="goTo" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface User {
  id: number
  name: string
  email: string
  roles: string | null
}

const columns = [
  { key: 'name',  label: 'Name',  primary: true },
  { key: 'role',  label: 'Role' },
]

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

const authStore = useAuthStore()
const usersCache = useState<User[]>('users-list', () => [])
const users = ref<User[]>([])
const loading = ref(true)
const { search, sort, view, selectedCount, onSelect, onDelete } = useListToolbar()
const { page, lastPage, total, setMeta, goTo } = useListPagination()

async function fetchData() {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<{ data: User[] | PaginatedResponse<User> }>(`/users?page=${page.value}`)
    const d = res.data
    if (Array.isArray(d)) { users.value = d }
    else { users.value = d.data; setMeta(d.meta) }
    usersCache.value = users.value
  }
  catch { users.value = [] }
  finally { loading.value = false }
}

onMounted(fetchData)
watch(page, fetchData)

const filtered = computed(() => {
  let result = [...users.value]

  // Always ensure the logged-in user appears on page 1
  const me = authStore.user
  if (page.value === 1 && me && !result.some(u => u.id === (me.id as number))) {
    result.unshift({
      id: me.id as number,
      name: me.name as string,
      email: me.email as string,
      roles: me.roles as string | null,
    })
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q),
    )
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  return result
})

const tableRows = computed(() =>
  filtered.value.map(u => ({
    name: u.name,
    email: u.email,
    role: u.roles ?? '—',
    _raw: u,
  })),
)


function onAdd() { navigateTo('/users/create') }
function onDeleteRow(_row: Record<string, unknown>, _idx: number) { /* TODO */ }

type BadgeVariant = 'warning' | 'primary' | 'success' | 'danger' | 'neutral'

function roleVariant(role: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    admin:   'primary',
    master:  'danger',
    manager: 'warning',
    user:    'neutral',
  }
  return map[role] ?? 'neutral'
}
</script>
