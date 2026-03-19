<template>
  <div class="blank-state">
    <div class="blank-state__content">
      <h2 class="blank-state__title">{{ title }}</h2>
      <p class="blank-state__message">{{ message }}</p>
      <div v-if="$slots.default" class="blank-state__action">
        <slot />
      </div>
    </div>
    <div class="blank-state__image">
      <img :src="image" :alt="title" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  image: string
  title: string
  message: string
}>()
</script>

<style scoped>
.blank-state {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-10) var(--space-6);
  min-height: 360px;
}

@media (min-width: 768px) {
  .blank-state {
    flex-direction: row;
    justify-content: space-between;
    padding: var(--space-10) var(--space-8);
  }
}

.blank-state__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);

  @media (min-width: 768px) {
    align-items: flex-start;
    text-align: left;
    max-width: 380px;
  }
}

.blank-state__title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.blank-state__message {
  font-size: var(--text-base);
  color: var(--color-text-muted);
}

.blank-state__action {
  margin-top: var(--space-2);
}

.blank-state__image {
  flex-shrink: 0;

  img {
    width: 100%;
    max-width: 260px;
    max-height: 260px;
    object-fit: contain;

    @media (min-width: 768px) {
      max-width: 340px;
      max-height: 320px;
    }
  }
}
</style>
