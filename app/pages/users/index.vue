<template>
  <div>

    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Users' }]" />
        </div>

        <AppPageHeader :title="isInactive ? 'Inactive Users' : 'Users'">
          <AppButton icon="add" class="d-none d-md-flex" @click="onAdd">Create User</AppButton>
        </AppPageHeader>

        <div class="col-12">
          <AppListToolbar v-model:search="search" v-model:sort="sort" v-model:view="view" label="user"
            add-label="Create User" :show-toggle="hasInactiveUsers" :is-active="!isInactive"
            @update:is-active="(v: boolean) => setInactive(!v)" @add="onAdd" />
        </div>

        <div class="col-12">
          <div v-if="loading" class="skeleton-rows">
            <div class="skeleton-row"><AppSkeleton width="45%" /><AppSkeleton width="30%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="35%" /><AppSkeleton width="40%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="50%" /><AppSkeleton width="25%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="30%" /><AppSkeleton width="35%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="40%" /><AppSkeleton width="28%" /><AppSkeleton width="15%" /></div>
          </div>

          <AppBlankState v-else-if="isInactive && deletedFiltered.length === 0" image="/images/blankPages/users.svg"
            title="No inactive users" message="Users that are deactivated will appear here." />

          <AppBlankState v-else-if="!isInactive && blankState.show.value" :image="blankState.image.value"
            :title="blankState.title.value" :message="blankState.message.value">
            <AppButton @click="onAdd">
              <span class="material-icons-round">add</span>
              Create User
            </AppButton>
          </AppBlankState>

          <template v-else-if="effectiveView === 'list'">
            <AppTable v-if="!isInactive" :columns="columns" :rows="tableRows" @edit="(row) => navigateTo(userLink((row._raw as User).id))" @deactivate="onDeleteRow">
              <template #cell-name="{ value, row }">
                <NuxtLink :to="userLink((row._raw as User).id)" class="app-table__cell-link subheading-1">{{ value }}</NuxtLink>
              </template>

              <template #cell-role="{ value }">
                <AppBadge :variant="roleVariant(value as string)">{{ value }}</AppBadge>
              </template>
            </AppTable>

            <AppTable v-else :columns="deletedColumns" :rows="deletedTableRows" :is-active="false"
              @activate="(row) => onActivate(row._raw as DeletedUser)" @delete="(row) => onDelete(row._raw as DeletedUser)">
              <template #cell-name="{ value, row }">
                <NuxtLink :to="userLink((row._raw as DeletedUser).id)" class="app-table__cell-link subheading-1">{{ value }}</NuxtLink>
              </template>
            </AppTable>
          </template>

          <template v-else-if="!isInactive">
            <div class="list-mosaic">
              <div v-for="user in filtered" :key="user.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="userLink(user.id)" class="list-card__title cta2">{{ user.name }}</NuxtLink>
                </div>
                <div class="list-card__meta-row caption3">
                  {{ user.phone }}
                </div>

                <div class="list-card__meta">
                  <div class="list-card__meta-row caption3">
                    {{ user.email }}
                  </div>
                </div>
                <div class="list-card__footer">
                  <AppBadge :variant="roleVariant(user.roles ?? '')">{{ user.roles ?? 'No role' }}</AppBadge>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="list-mosaic">
              <div v-for="item in deletedFiltered" :key="item.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="userLink(item.id)" class="list-card__title cta2">{{ item.name }}</NuxtLink>
                  <div class="list-card__actions">
                    <button class="list-card__activate" title="Activate" @click="onActivate(item)">
                      <span class="material-icons-round">toggle_on</span>
                    </button>
                    <button class="list-card__delete" title="Delete" @click="onDelete(item)">
                      <span class="material-icons-round">delete</span>
                    </button>
                  </div>
                </div>
                <div class="list-card__meta">
                  <div class="list-card__meta-row caption3">Deleted {{ formatDate(item.updated_at) }}</div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-if="!isInactive" class="col-12">
          <AppPagination :page="page" :last-page="lastPage" :total="total" @go="goTo" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })

interface User {
  id: number
  name: string
  email: string
  phone: string | null
  roles: string | null
}

interface DeletedUser {
  id: number
  name: string
  updated_at: string
}

const columns = [
  { key: 'name', label: 'Name', primary: true },
  { key: 'contact', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
]

const deletedColumns = [
  { key: 'name', label: 'Name', primary: true },
  { key: 'deleted', label: 'Deleted' },
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

const route = useRoute()
const router = useRouter()
const isInactive = computed(() => route.query.status === 'inactive')

const toast = useAppToast()
const authStore = useAuthStore()
const usersCache = useState<User[]>('users-list', () => [])
const users = ref<User[]>([])
const deletedUsers = ref<DeletedUser[]>([])
const hasInactiveFlag = ref(false)
const { loading, withMinTime } = useMinLoadingTime()
const { search, sort, view } = useListToolbar()
const isMobile = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', e => { isMobile.value = e.matches })
})
const effectiveView = computed(() => isMobile.value ? 'grid' : view.value)
const { page, lastPage, total, setMeta, goTo } = useListPagination()

function setInactive(value: boolean) {
  const query = { ...route.query }
  if (value) query.status = 'inactive'
  else delete query.status
  router.replace({ query })
}

function userLink(id: number) {
  return isInactive.value ? `/users/${id}?status=inactive` : `/users/${id}`
}

async function fetchData() {
  await withMinTime(async () => {
    try {
      const api = useApi()
      if (isInactive.value) {
        const res = await api<{ data: DeletedUser[] }>('/users/inactive')
        deletedUsers.value = res.data ?? []
      }
      else {
        const res = await api<{ data: User[] | PaginatedResponse<User>, has_inactive?: boolean }>(`/users?page=${page.value}`)
        const d = res.data
        if (Array.isArray(d)) { users.value = d }
        else { users.value = d.data; setMeta(d.meta) }
        usersCache.value = users.value
        hasInactiveFlag.value = res.has_inactive ?? false
      }
    }
    catch {
      if (isInactive.value) deletedUsers.value = []
      else users.value = []
    }
  })
}

onMounted(fetchData)
watch(page, fetchData)
watch(isInactive, fetchData)

const hasInactiveUsers = computed(() => isInactive.value || hasInactiveFlag.value)

const filtered = computed(() => {
  let result = [...users.value]

  const me = authStore.user
  if (page.value === 1 && me && !result.some(u => u.id === (me.id as number))) {
    result.unshift({
      id: me.id as number,
      name: me.name as string,
      email: me.email as string,
      phone: (me.phone as string | null) ?? null,
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

const deletedFiltered = computed(() => {
  let result = [...deletedUsers.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(u => u.name.toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
  else result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
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
    contact: u.phone ?? '—',
    role: u.roles ?? '—',
    _raw: u,
  })),
)

const deletedTableRows = computed(() =>
  deletedFiltered.value.map(u => ({
    name: u.name,
    deleted: formatDate(u.updated_at),
    _raw: u,
  })),
)

function onAdd() { navigateTo('/users/create') }

async function onDeleteRow(row: Record<string, unknown>, _idx: number) {
  const user = row._raw as User
  try {
    const api = useApi()
    await api(`/users/${user.id}/toggle-active`, { method: 'PATCH' })
    toast.success('User deactivated', { category: 'user' })
    await fetchData()
  }
  catch (err) {
    toast.error(err, 'Could not deactivate user', { category: 'user' })
  }
}

async function onActivate(item: DeletedUser) {
  try {
    const api = useApi()
    await api(`/users/${item.id}/toggle-active`, { method: 'PATCH' })
    deletedUsers.value = deletedUsers.value.filter(i => i.id !== item.id)
    toast.success('User activated', { category: 'user' })
  }
  catch (err) { toast.error(err, 'Failed to activate user', { category: 'user' }) }
}

async function onDelete(item: DeletedUser) {
  try {
    const api = useApi()
    await api(`/users/${item.id}/archive`, { method: 'DELETE' })
    deletedUsers.value = deletedUsers.value.filter(i => i.id !== item.id)
    toast.success('User deleted', { category: 'user' })
  }
  catch (err) { toast.error(err, 'Failed to delete user', { category: 'user' }) }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type BadgeVariant = 'warning' | 'primary' | 'success' | 'danger' | 'neutral'

function roleVariant(role: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    admin: 'primary',
    master: 'danger',
    manager: 'warning',
    user: 'neutral',
  }
  return map[role] ?? 'neutral'
}
</script>
