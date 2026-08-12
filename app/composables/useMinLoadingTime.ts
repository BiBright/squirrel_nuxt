export function useMinLoadingTime(minMs = 400) {
  const loading = ref(true)

  async function withMinTime(fn: () => Promise<void>) {
    loading.value = true
    const start = Date.now()
    try {
      await fn()
    }
    finally {
      const elapsed = Date.now() - start
      if (elapsed < minMs) await new Promise(resolve => setTimeout(resolve, minMs - elapsed))
      loading.value = false
    }
  }

  return { loading, withMinTime }
}
