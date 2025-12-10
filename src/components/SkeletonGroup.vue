<template>
  <div class="skeleton-group" :class="`skeleton-group-${layout}`">
    <SkeletonLoader
      v-for="i in count"
      :key="i"
      :type="type"
    />
  </div>
</template>

<script setup>
import SkeletonLoader from './SkeletonLoader.vue'

defineProps({
  type: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'image', 'text', 'note', 'post'].includes(value)
  },
  count: {
    type: Number,
    default: 3
  },
  layout: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list', 'flex'].includes(value)
  }
})
</script>

<style scoped>
.skeleton-group {
  display: grid;
  gap: 16px;
  width: 100%;
}

/* グリッドレイアウト */
.skeleton-group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

/* リストレイアウト */
.skeleton-group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* フレックスレイアウト */
.skeleton-group-flex {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 0;
}

.skeleton-group-flex > * {
  flex-shrink: 0;
  width: 200px;
}

@media (max-width: 768px) {
  .skeleton-group-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .skeleton-group-flex > * {
    width: 150px;
  }
}
</style>
