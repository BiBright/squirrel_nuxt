<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <AppBreadcrumb :items="[{ label: 'Suppliers', to: '/suppliers' }, { label: 'Inactive Suppliers' }]" />
      </div>

      <AppPageHeader title="Inactive Suppliers" />

      <div class="col-12">
        <div class="deleted-toolbar">
          <div class="input-search-wrap">
            <span class="material-icons-round input-search-wrap__icon">search</span>
            <input v-model="search" type="text" class="input-search" placeholder="Search suppliers..." />
          </div>

          <div ref="sortRef" class="sort-dropdown">
            <button class="sort-dropdown__btn" :class="{ 'is-open': sortOpen }" @click="sortOpen = !sortOpen">
              <span class="material-icons-round">sort</span>
              {{ sortLabel }}
              <span class="material-icons-round sort-dropdown__chevron">{{ sortOpen ? 'expand_less' : 'expand_more' }}</span>
            </button>
            <div v-if="sortOpen" class="sort-dropdown__panel">
              <button v-for="opt in sortOptions" :key="opt.value" class="sort-dropdown__option"
                :class="{ 'is-active': sort === opt.value }" @click="sort = opt.value; sortOpen = false">
                <span v-if="sort === opt.value" class="material-icons-round sort-dropdown__check">check</span>
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div v-if="loading" class="skeleton-rows">
          <div class="skeleton-row"><AppSkeleton width="45%" /><AppSkeleton width="30%" /><AppSkeleton width="15%" /></div>
          <div class="skeleton-row"><AppSkeleton width="35%" /><AppSkeleton width="40%" /><AppSkeleton width="15%" /></div>
          <div class="skeleton-row"><AppSkeleton width="50%" /><AppSkeleton width="25%" /><AppSkeleton width="15%" /></div>
          <div class="skeleton-row"><AppSkeleton width="30%" /><AppSkeleton width="35%" /><AppSkeleton width="15%" /></div>
          <div class="skeleton-row"><AppSkeleton width="40%" /><AppSkeleton width="28%" /><AppSkeleton width="15%" /></div>
        </div>

        <AppBlankState
          v-else-if="filtered.length === 0"
          image="/images/blankPages/suppliers.svg"
          title="No inactive suppliers"
          message="Suppliers that are deactivated will appear here."
        />

        <div v-else class="deleted-list">
          <div v-for="item in filtered" :key="item.id" class="deleted-item">
            <div class="deleted-item__info">
              <p class="deleted-item__name">{{ item.name }}</p>
              <p class="deleted-item__date">Deleted {{ formatDate(item.updated_at) }}</p>
            </div>
            <div class="item-more-wrapper" @click.stop>
              <button class="item-more-btn" :class="{ 'is-active': openMenu === item.id }"
                @click.stop="openMenu = openMenu === item.id ? null : item.id">
                <span class="material-icons-round">more_horiz</span>
              </button>
              <div v-if="openMenu === item.id" class="item-more-panel">
                <button class="item-more-option" @click="onActivate(item); openMenu = null">
                  <span class="material-icons-round">toggle_on</span>
                  Activate
                </button>
                <button class="item-more-option item-more-option--danger" @click="onDelete(item); openMenu = null">
                  <span class="material-icons-round">delete</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface DeletedItem {
  id: number
  name: string
  updated_at: string
}

const api = useApi()
const toast = useAppToast()

const loading = ref(true)
const items = ref<DeletedItem[]>([])
const search = ref('')
const sort = ref('recent')
const sortOpen = ref(false)
const sortRef = ref<HTMLElement | null>(null)
const openMenu = ref<number | null>(null)
onClickOutside(sortRef, () => { sortOpen.value = false })

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A to Z' },
]
const sortLabel = computed(() => sortOptions.find(o => o.value === sort.value)?.label ?? 'Sort')

onMounted(async () => {
  try {
    // Backend endpoint needed: GET /suppliers/inactive
    const res = await api<{ data: DeletedItem[] }>('/suppliers/inactive')
    items.value = res.data ?? []
  }
  catch { items.value = [] }
  finally { loading.value = false }
})

const filtered = computed(() => {
  let result = [...items.value]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.name.toLowerCase().includes(q))
  }
  if (sort.value === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'oldest') result.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
  else result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  return result
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function onActivate(item: DeletedItem) {
  try {
    await api(`/suppliers/${item.id}/toggle-active`, { method: 'PATCH' })
    items.value = items.value.filter(i => i.id !== item.id)
    toast.success('Supplier activated', { category: 'supplier' })
  }
  catch (err) { toast.error(err, 'Failed to activate supplier', { category: 'supplier' }) }
}

async function onDelete(item: DeletedItem) {
  try {
    await api(`/suppliers/${item.id}/archive`, { method: 'DELETE' })
    items.value = items.value.filter(i => i.id !== item.id)
    toast.success('Supplier deleted', { category: 'supplier' })
  }
  catch (err) { toast.error(err, 'Failed to delete supplier', { category: 'supplier' }) }
}
</script>