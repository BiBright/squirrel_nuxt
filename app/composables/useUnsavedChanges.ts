export function useUnsavedChanges() {
  const isDirty = ref(false)
  const showModal = ref(false)
  const pendingPath = ref<string | null>(null)
  const router = useRouter()

  onBeforeRouteLeave((to, _from, next) => {
    if (!isDirty.value) return next()
    pendingPath.value = to.fullPath
    showModal.value = true
    next(false)
  })

  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

  function onBeforeUnload(e: BeforeUnloadEvent) {
    if (!isDirty.value) return
    e.preventDefault()
    e.returnValue = ''
  }

  function confirmLeave() {
    isDirty.value = false
    showModal.value = false
    if (pendingPath.value) router.push(pendingPath.value)
  }

  function cancelLeave() {
    showModal.value = false
    pendingPath.value = null
  }

  return { isDirty, showModal, confirmLeave, cancelLeave }
}
