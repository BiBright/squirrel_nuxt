export function useListToolbar() {
  const search = ref('')
  const sort = ref('recent')
  const view = ref<'list' | 'grid'>('list')
  const selectedCount = ref(0)

  function onSelect(indices: number[]) {
    selectedCount.value = indices.length
  }

  function onDelete() {
    selectedCount.value = 0
  }

  return { search, sort, view, selectedCount, onSelect, onDelete }
}
