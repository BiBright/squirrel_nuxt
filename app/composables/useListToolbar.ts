export function useListToolbar() {
  const search = ref('')
  const sort = ref('recent')
  const view = ref<'list' | 'grid'>('list')

  return { search, sort, view }
}
