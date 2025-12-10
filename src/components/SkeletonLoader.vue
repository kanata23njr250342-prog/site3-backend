<template>
  <div class="skeleton-loader" :class="`skeleton-${type}`">
    <div class="skeleton-shimmer"></div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'image', 'text', 'note', 'post'].includes(value)
  }
})
</script>

<style scoped>
.skeleton-loader {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 8px;
  overflow: hidden;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* カード型スケルトン */
.skeleton-card {
  width: 100%;
  height: 200px;
  border-radius: 12px;
}

/* 画像型スケルトン */
.skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
}

/* テキスト型スケルトン */
.skeleton-text {
  width: 100%;
  height: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-text:last-child {
  margin-bottom: 0;
}

/* ノート型スケルトン */
.skeleton-note {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 投稿作品型スケルトン */
.skeleton-post {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
