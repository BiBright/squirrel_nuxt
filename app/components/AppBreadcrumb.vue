<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ul class="breadcrumb__list">

      <li class="breadcrumb__item">
        <NuxtLink to="/" class="breadcrumb__home">
          <span class="material-icons-round">home</span>
        </NuxtLink>
      </li>

      <li v-for="(item, i) in items" :key="i" class="breadcrumb__item">
        <span class="material-icons-round breadcrumb__sep">chevron_right</span>
        <NuxtLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="breadcrumb__link"
        >{{ item.label }}</NuxtLink>
        <span v-else class="breadcrumb__current">{{ item.label }}</span>
      </li>

    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  items: { label: string; to?: string }[]
}>()
</script>

<style scoped>
.breadcrumb {
  height: 68px;
  display: flex;
  align-items: center;
}

.breadcrumb__list {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.breadcrumb__home {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}
.breadcrumb__home:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}
.breadcrumb__home .material-icons-round { font-size: 20px; }

.breadcrumb__sep {
  font-size: 16px;
  color: var(--color-black40);
}

.breadcrumb__link {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.breadcrumb__link:hover { color: var(--color-primary); }

.breadcrumb__current {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}
</style>
