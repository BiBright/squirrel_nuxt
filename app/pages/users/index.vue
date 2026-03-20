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

    <AppBlankState
      v-else-if="blankState.show.value"
      :image="blankState.image.value"
      :title="blankState.title.value"
      :message="blankState.message.value"
    >
      <AppButton @click="onAdd">
        <span class="material-icons-round">add</span>
        Create User
      </AppButton>
    </AppBlankState>

    <template v-else-if="effectiveView === 'list'">
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
      </AppTable>
    </template>

    <!-- MOSAIC VIEW -->
    <template v-else>
      <div class="list-mosaic">
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

const toast = useAppToast()
const auth = useAuth()
const usersCache = useState<User[]>('users-list', () => [])
const users = ref<User[]>([])
const loading = ref(true)
const { search, sort, view, selectedCount, onSelect, onDelete } = useListToolbar()
const isMobile = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', e => { isMobile.value = e.matches })
})
const effectiveView = computed(() => isMobile.value ? 'grid' : view.value)
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
  const me = auth.user
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

const blankState = useBlankState(filtered, search, {
  image: '/images/blankPages/users.svg',
  title: 'No users yet',
  message: 'Add your first team member to get started.',
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

async function onDeleteRow(row: Record<string, unknown>, _idx: number) {
  const user = row._raw as User
  try {
    const api = useApi()
    await api(`/users/${user.id}`, { method: 'DELETE' })
    users.value = users.value.filter(u => u.id !== user.id)
    usersCache.value = users.value
    toast.success('User deleted', { category: 'user' })
  }
  catch (err) {
    toast.error(err, 'Could not delete user', { category: 'user' })
  }
}

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
