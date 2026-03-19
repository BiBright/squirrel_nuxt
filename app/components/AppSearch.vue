<template>
  <div ref="root" class="app-search">
    <div class="app-search__input-wrap">
      <span class="material-icons-round app-search__icon">search</span>
      <input
        v-model="query"
        type="text"
        class="app-search__input"
        placeholder="Search..."
        autocomplete="off"
        @focus="results && (open = true)"
      />
      <button v-if="query" type="button" class="app-search__clear" aria-label="Clear" @click="clear">
        <span class="material-icons-round">close</span>
      </button>
    </div>

    <div v-if="open" class="app-search__panel">
      <div v-if="loading" class="app-search__state">
        <span class="material-icons-round">hourglass_empty</span>
        Searching...
      </div>
      <div v-else-if="empty" class="app-search__state">
        No results found for your search.
      </div>
      <template v-else-if="results">
        <div v-if="results.suppliers.length" class="app-search__group">
          <p class="app-search__group-title">Suppliers</p>
          <NuxtLink
            v-for="s in results.suppliers"
            :key="s.id"
            :to="`/suppliers/${s.id}`"
            class="app-search__item"
            @click="clear"
          >
            <span class="material-icons-round">local_shipping</span>
            {{ s.name }}
          </NuxtLink>
        </div>
        <div v-if="results.fields.length" class="app-search__group">
          <p class="app-search__group-title">Fields</p>
          <NuxtLink
            v-for="f in results.fields"
            :key="f.id"
            :to="`/fields/${f.id}`"
            class="app-search__item"
            @click="clear"
          >
            <span class="material-icons-round">input</span>
            {{ f.name }}
          </NuxtLink>
        </div>
        <div v-if="results.forms.length" class="app-search__group">
          <p class="app-search__group-title">Forms</p>
          <NuxtLink
            v-for="f in results.forms"
            :key="f.id"
            :to="`/forms/${f.id}`"
            class="app-search__item"
            @click="clear"
          >
            <span class="material-icons-round">description</span>
            {{ f.name }}
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

interface SearchResult {
  suppliers: { id: number; name: string }[]
  fields:    { id: number; name: string }[]
  forms:     { id: number; name: string }[]
}

const root    = ref<HTMLElement | null>(null)
const query   = ref('')
const open    = ref(false)
const loading = ref(false)
const results = ref<SearchResult | null>(null)

const empty = computed(() =>
  results.value !== null &&
  !results.value.suppliers.length &&
  !results.value.fields.length &&
  !results.value.forms.length,
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val.trim()) { results.value = null; open.value = false; return }
  debounceTimer = setTimeout(() => search(val.trim()), 500)
})

async function search(q: string) {
  loading.value = true
  open.value = true
  try {
    const api = useApi()
    const terms = q.split(/\s+/).filter(Boolean)
    const res = await api<{ success?: Array<Record<string, unknown>> }>('/searchmaster', {
      method: 'POST',
      body: { search: terms },
    })
    const list = res.success ?? []
    results.value = {
      suppliers: list.filter(r => 'supplier_id' in r).map(r => ({ id: r.supplier_id as number, name: r.supplier_name as string })),
      fields:    list.filter(r => 'fields_id'   in r).map(r => ({ id: r.fields_id   as number, name: r.fields_name   as string })),
      forms:     list.filter(r => 'forms_id'    in r).map(r => ({ id: r.forms_id    as number, name: r.forms_name    as string })),
    }
  }
  catch {
    results.value = { suppliers: [], fields: [], forms: [] }
  }
  finally { loading.value = false }
}

function clear() {
  query.value = ''
  results.value = null
  open.value = false
}

onClickOutside(root, () => { open.value = false })
</script>

<style scoped>
.app-search {
  position: relative;
  width: 100%;
}

.app-search__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.app-search__icon {
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-xl);
  pointer-events: none;
}

.app-search__input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-8) 0 var(--space-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.15s;
}

.app-search__input:focus {
  border-color: var(--color-primary);
}

.app-search__input::placeholder {
  color: var(--color-text-muted);
}

.app-search__clear {
  position: absolute;
  right: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color 0.15s;
}

.app-search__clear:hover { color: var(--color-text); }
.app-search__clear .material-icons-round { font-size: var(--text-lg); }

.app-search__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 300;
}

.app-search__state {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.app-search__state .material-icons-round { font-size: var(--text-xl); }

.app-search__group {
  padding: var(--space-2) 0;
}

.app-search__group + .app-search__group {
  border-top: 1px solid var(--color-border);
}

.app-search__group-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-4);
}

.app-search__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: none;
  transition: background 0.15s;
}

.app-search__item:hover {
  background: var(--color-surface-hover);
  color: var(--color-primary);
}

.app-search__item .material-icons-round {
  font-size: var(--text-xl);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.app-search__item:hover .material-icons-round {
  color: var(--color-primary);
}
</style>
