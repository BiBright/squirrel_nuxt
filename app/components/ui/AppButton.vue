<template>
  <component
    :is="computedTag"
    v-bind="computedProps"
    :class="['btn', `btn-${variant}`, { 'btn--loading': loading, 'btn--full': fullWidth }]"
  >
    <span v-if="icon && iconPosition === 'left'" class="btn-icon material-icons-round">{{ icon }}</span>
    <span v-if="loading" class="btn-loading-dot" />
    <slot />
    <span v-if="icon && iconPosition === 'right'" class="btn-icon material-icons-round">{{ icon }}</span>
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  tag?: string
  type?: 'button' | 'submit' | 'reset'
  to?: string
  href?: string
  icon?: string
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  iconPosition: 'left',
  loading: false,
  disabled: false,
  fullWidth: false,
})

const computedTag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return props.tag ?? 'button'
})

const computedProps = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }
  return { type: props.type, disabled: props.disabled || props.loading }
})
</script>

<style scoped>
.btn--full {
  width: 100%;
  justify-content: center;
}
.btn--loading {
  opacity: 0.7;
  cursor: wait;
}
.btn-loading-dot {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
