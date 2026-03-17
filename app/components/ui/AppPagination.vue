<template>
  <div v-if="lastPage > 1" class="pagination">
    <button class="pagination__btn" :disabled="page === 1" @click="$emit('go', page - 1)">
      <span class="material-icons-round">chevron_left</span>
    </button>

    <template v-for="p in pages" :key="p">
      <span v-if="p === '...'" class="pagination__ellipsis">…</span>
      <button
        v-else
        class="pagination__btn"
        :class="{ 'pagination__btn--active': p === page }"
        @click="$emit('go', p as number)"
      >
        {{ p }}
      </button>
    </template>

    <button class="pagination__btn" :disabled="page === lastPage" @click="$emit('go', page + 1)">
      <span class="material-icons-round">chevron_right</span>
    </button>

    <span class="pagination__info">{{ total }} total</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number
  lastPage: number
  total: number
}>()

defineEmits<{ go: [page: number] }>()

const pages = computed(() => {
  const current = props.page
  const last = props.lastPage
  const range: (number | '...')[] = []

  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= current - 2 && i <= current + 2)) {
      range.push(i)
    }
    else if (range[range.length - 1] !== '...') {
      range.push('...')
    }
  }

  return range
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-4) 0;
}

.pagination__btn {
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.pagination__btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.pagination__btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.pagination__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.pagination__btn--active:hover {
  background: var(--color-primary);
}

.pagination__ellipsis {
  padding: 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.pagination__info {
  margin-left: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
