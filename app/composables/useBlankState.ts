import type { ComputedRef, Ref } from 'vue'

interface BlankStateConfig {
  image: string
  title: string
  message: string
}

export function useBlankState(
  items: Ref<unknown[]> | ComputedRef<unknown[]>,
  search: Ref<string>,
  config: BlankStateConfig,
) {
  const isSearching = computed(() => search.value.trim().length > 0)

  const show = computed(() => items.value.length === 0)

  const image = computed(() =>
    isSearching.value ? '/images/blankPages/noResult.svg' : config.image,
  )

  const title = computed(() =>
    isSearching.value ? 'Oops!' : config.title,
  )

  const message = computed(() =>
    isSearching.value ? 'No results matched your search.' : config.message,
  )

  return { show, image, title, message }
}
