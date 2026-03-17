export function useListPagination() {
  const page = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const perPage = ref(20)

  function setMeta(meta: { current_page: number, last_page: number, total: number, per_page: number }) {
    page.value = meta.current_page
    lastPage.value = meta.last_page
    total.value = meta.total
    perPage.value = meta.per_page
  }

  function goTo(p: number) {
    if (p < 1 || p > lastPage.value) return
    page.value = p
  }

  return { page, lastPage, total, perPage, setMeta, goTo }
}
