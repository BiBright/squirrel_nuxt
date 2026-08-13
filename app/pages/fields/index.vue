<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <AppBreadcrumb :items="[{ label: 'Models' }, { label: 'Fields', to: '/fields' }]" />
        </div>

        <AppPageHeader :title="isInactive ? 'Inactive Fields' : 'Fields'">
          <AppButton icon="add" class="d-none d-md-flex" to="/fields/create">New Field</AppButton>
        </AppPageHeader>

        <div class="col-12">
          <AppListToolbar v-model:search="search" v-model:sort="sort" v-model:view="view" label="field"
            add-label="New Field" :show-toggle="hasInactiveFields" :is-active="!isInactive"
            @update:is-active="(v: boolean) => setInactive(!v)" @add="navigateTo('/fields/create')" />
        </div>

        <div class="col-12">
          <div v-if="loading" class="skeleton-rows">
            <div class="skeleton-row"><AppSkeleton width="45%" /><AppSkeleton width="30%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="35%" /><AppSkeleton width="40%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="50%" /><AppSkeleton width="25%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="30%" /><AppSkeleton width="35%" /><AppSkeleton width="15%" /></div>
            <div class="skeleton-row"><AppSkeleton width="40%" /><AppSkeleton width="28%" /><AppSkeleton width="15%" /></div>
          </div>

          <AppBlankState v-else-if="isInactive && deletedFiltered.length === 0" image="/images/blankPages/noResult.svg"
            title="Oops!" message="No deleted fields." />

          <AppBlankState v-else-if="!isInactive && blankState.show.value" :image="blankState.image.value"
            :title="blankState.title.value" :message="blankState.message.value">
            <AppButton to="/fields/create">
              <span class="material-icons-round">add</span>
              New Field
            </AppButton>
          </AppBlankState>

          <template v-else-if="effectiveView === 'list'">
            <AppTable v-if="!isInactive" :columns="columns" :rows="tableRows"
              @edit="(row) => navigateTo(fieldLink((row._raw as Field).id))" @deactivate="onDeleteRow">

              <template #cell-name="{ value, row }">
                <NuxtLink :to="fieldLink((row._raw as Field).id)" class="app-table__cell-link subheading-1">{{ value }}</NuxtLink>
              </template>

              <template #cell-file="{ value, row }">
                <a v-if="value" :href="(row.fileUrl as string)" class="file-download-link" target="_blank" download>
                  <span class="material-icons-round">attach_file</span>
                  {{ value }}
                </a>
                <span v-else class="text-muted">—</span>
              </template>

              <template #cell-type="{ value }">
                <AppBadge variant="neutral">{{ value }}</AppBadge>
              </template>

              <template #cell-status="{ value }">
                <AppBadge :variant="value === 'Active' ? 'success' : 'danger'">{{ value }}</AppBadge>
              </template>
            </AppTable>

            <AppTable v-else :columns="deletedColumns" :rows="deletedTableRows" :is-active="false"
              @activate="(row) => onActivate(row._raw as DeletedField)" @delete="(row) => onDelete(row._raw as DeletedField)">
              <template #cell-name="{ value, row }">
                <NuxtLink :to="fieldLink((row._raw as DeletedField).id)" class="app-table__cell-link subheading-1">{{ value }}</NuxtLink>
              </template>
            </AppTable>
          </template>

          <template v-else-if="!isInactive">
            <div class="list-mosaic">
              <div v-for="field in filtered" :key="field.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="fieldLink(field.id)" class="list-card__title cta2">{{ field.name }}</NuxtLink>
                </div>
                <div class="list-card__meta">
                  <div v-if="field.description" class="list-card__meta-row caption3">
                    {{ field.description }}
                  </div>
                  <div v-if="field.template_file_name" class="list-card__meta-row caption3 field-file-row">
                    <span class="material-icons-round">attach_file</span>
                    {{ field.template_file_name }}
                  </div>
                </div>
                <div class="list-card__footer">
                  <AppBadge variant="neutral">{{ field.type_label }}</AppBadge>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="list-mosaic">
              <div v-for="item in deletedFiltered" :key="item.id" class="list-card">
                <div class="list-card__header">
                  <NuxtLink :to="fieldLink(item.id)" class="list-card__title cta2">{{ item.name }}</NuxtLink>
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
definePageMeta({ middleware: ['auth'] })

interface Field {
  id: number
  name: string
  description: string | null
  type: string
  type_label: string
  is_active: boolean
  created_at: string
  template_file_name: string | null
  template_file_url: string | null
}

interface DeletedField {
  id: number
  name: string
  updated_at: string
}

const columns = [
  { key: 'name', label: 'Field Name', primary: true },
  { key: 'description', label: 'Description' },
  { key: 'file', label: 'File' }
]

const deletedColumns = [
  { key: 'name', label: 'Field Name', primary: true },
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
const fields = ref<Field[]>([])
const deletedFields = ref<DeletedField[]>([])
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

function fieldLink(id: number) {
  return isInactive.value ? `/fields/${id}?status=inactive` : `/fields/${id}`
}

async function fetchData() {
  await withMinTime(async () => {
    try {
      const api = useApi()
      if (isInactive.value) {
        const res = await api<{ data: DeletedField[] }>('/fields/inactive')
        deletedFields.value = res.data ?? []
      }
      else {
        const res = await api<{ data: Field[] | PaginatedResponse<Field>, has_inactive?: boolean }>(`/fields?page=${page.value}`)
        const d = res.data
        if (Array.isArray(d)) { fields.value = d }
        else { fields.value = d.data; setMeta(d.meta) }
        hasInactiveFlag.value = res.has_inactive ?? false
      }
    }
    catch {
      if (isInactive.value) deletedFields.value = []
      else fields.value = []
    }
  })
}

onMounted(fetchData)
watch(page, fetchData)
watch(isInactive, fetchData)

const hasInactiveFields = computed(() => isInactive.value || hasInactiveFlag.value)

const filtered = computed(() => {
  let result = [...fields.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(f => f.name.toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const deletedFiltered = computed(() => {
  let result = [...deletedFields.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(f => f.name.toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'za') result.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
  else result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  return result
})

const blankState = useBlankState(filtered, search, {
  image: '/images/blankPages/fields.svg',
  title: 'No fields yet',
  message: 'Create reusable input fields for your forms.',
})

const tableRows = computed(() =>
  filtered.value.map(f => ({
    name: f.name,
    description: f.description,
    file: f.template_file_name,
    fileUrl: f.template_file_url,
    type: f.type_label,
    status: f.is_active ? 'Active' : 'Inactive',
    date: formatDate(f.created_at),
    _raw: f,
  })),
)

const deletedTableRows = computed(() =>
  deletedFiltered.value.map(f => ({
    name: f.name,
    deleted: formatDate(f.updated_at),
    _raw: f,
  })),
)

async function onDeleteRow(row: Record<string, unknown>, _idx: number) {
  const field = row._raw as Field
  try {
    const api = useApi()
    await api(`/fields/${field.id}/toggle-active`, { method: 'PATCH' })
    toast.success('Field deactivated', { category: 'field' })
    await fetchData()
  }
  catch (err) {
    toast.error(err, 'Could not deactivate field', { category: 'field' })
  }
}

async function onActivate(item: DeletedField) {
  try {
    const api = useApi()
    await api(`/fields/${item.id}/toggle-active`, { method: 'PATCH' })
    deletedFields.value = deletedFields.value.filter(i => i.id !== item.id)
    toast.success('Field activated', { category: 'field' })
  }
  catch (err) { toast.error(err, 'Failed to activate field', { category: 'field' }) }
}

async function onDelete(item: DeletedField) {
  try {
    const api = useApi()
    await api(`/fields/${item.id}/archive`, { method: 'DELETE' })
    deletedFields.value = deletedFields.value.filter(i => i.id !== item.id)
    toast.success('Field deleted', { category: 'field' })
  }
  catch (err) { toast.error(err, 'Failed to delete field', { category: 'field' }) }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.field-file-row {
  margin-top: var(--space-5);
}

.file-download-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: var(--text-sm);
  text-decoration: none;

  .material-icons-round {
    font-size: 16px;
  }
}
</style>
