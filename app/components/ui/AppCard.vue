<template>
  <div :class="['card', variantClass]">
    <div v-if="title || $slots.actions" class="card__header">
      <h3 v-if="title" class="card__title">{{ title }}</h3>
      <slot name="actions" />
    </div>
    <div class="card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  variant?: 'default' | 'primary' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const variantClass = computed(() => props.variant !== 'default' ? `card--${props.variant}` : '')
</script>
