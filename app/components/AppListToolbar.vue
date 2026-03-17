<template>
  <div class="list-toolbar">
    <div class="list-toolbar__search">
      <input
        type="text"
        class="input-search"
        :placeholder="`Search ${label}s...`"
        :value="search"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="list-toolbar__sort">
      <select
        class="input-select"
        :value="sort"
        @change="$emit('update:sort', ($event.target as HTMLSelectElement).value)"
      >
        <option value="recent">Most Recent</option>
        <option value="oldest">Oldest</option>
        <option value="az">A to Z</option>
        <option value="za">Z to A</option>
      </select>

      <div class="list-toolbar__view-toggle">
        <button
          class="btn-view"
          :data-active="view === 'list'"
          title="List view"
          @click="$emit('update:view', 'list')"
        >
          <span class="material-icons-round icon">view_list</span>
        </button>
        <button
          class="btn-view"
          :data-active="view === 'grid'"
          title="Mosaic view"
          @click="$emit('update:view', 'grid')"
        >
          <span class="material-icons-round icon">grid_view</span>
        </button>
      </div>
    </div>

    <div class="list-toolbar__actions">
      <!-- <span v-if="totalCount !== undefined" class="list-toolbar__count body01 text-muted">
        {{ totalCount }} {{ label }}{{ totalCount !== 1 ? 's' : '' }}
      </span> -->
    </div>

    <template v-if="selectedCount && selectedCount > 0">
      <slot name="bulk-actions" />
      <AppButton variant="danger" icon="delete" @click="$emit('delete')">
        Delete ({{ selectedCount }})
      </AppButton>
    </template>

    <AppButton icon="add" @click="$emit('add')">{{ addLabel }}</AppButton>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  search: string
  sort: string
  view: 'list' | 'grid'
  label?: string
  addLabel?: string
  totalCount?: number
  selectedCount?: number
}>(), {
  label: 'item',
  addLabel: 'Add',
})

defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: string]
  'update:view': [value: 'list' | 'grid']
  'add': []
  'delete': []
}>()
</script>
