<script setup>
/**
 * FloatingPostsList - 浮遊ウィンドウ形式の投稿作品リスト
 * @component
 */
import { ref, computed } from 'vue'

const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  currentViewIndex: {
    type: Number,
    default: -1
  }
})

const emit = defineEmits(['view-post', 'add-post', 'edit-post', 'delete-post', 'context-menu'])

// ウィンドウ状態
const isCollapsed = ref(false)
const windowX = ref(window.innerWidth - 320)
const windowY = ref(20)
const windowWidth = ref(300)
const windowHeight = ref(400)
const minWidth = ref(250)
const minHeight = ref(200)

const isDraggingWindow = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)

const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartY = ref(0)
const resizeStartWidth = ref(0)
const resizeStartHeight = ref(0)

// ===== イベントハンドラ =====
const handleWindowMouseDown = (e) => {
  if (e.target.closest('.window-controls')) return
  
  isDraggingWindow.value = true
  dragStartX.value = e.clientX - windowX.value
  dragStartY.value = e.clientY - windowY.value
}

const handleWindowMouseMove = (e) => {
  if (isDraggingWindow.value) {
    windowX.value = e.clientX - dragStartX.value
    windowY.value = e.clientY - dragStartY.value
  } else if (isResizing.value) {
    const deltaX = e.clientX - resizeStartX.value
    const deltaY = e.clientY - resizeStartY.value
    
    windowWidth.value = Math.max(minWidth.value, resizeStartWidth.value + deltaX)
    windowHeight.value = Math.max(minHeight.value, resizeStartHeight.value + deltaY)
  }
}

const handleWindowMouseUp = () => {
  isDraggingWindow.value = false
  isResizing.value = false
}

const handleResizeStart = (e) => {
  e.preventDefault()
  isResizing.value = true
  resizeStartX.value = e.clientX
  resizeStartY.value = e.clientY
  resizeStartWidth.value = windowWidth.value
  resizeStartHeight.value = windowHeight.value
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handlePostClick = (post) => {
  emit('view-post', post)
}

const handleAddPost = () => {
  emit('add-post')
}

const handleEditPost = (post, e) => {
  e.stopPropagation()
  emit('edit-post', post)
}

const handleDeletePost = (postId, e) => {
  e.stopPropagation()
  emit('delete-post', postId)
}

const handleContextMenu = (postId, isOwn, e) => {
  e.preventDefault()
  e.stopPropagation()
  emit('context-menu', postId, isOwn, e)
}

// ===== Computed =====
const windowStyle = computed(() => ({
  left: `${windowX.value}px`,
  top: `${windowY.value}px`,
  width: `${windowWidth.value}px`,
  height: isCollapsed.value ? 'auto' : `${windowHeight.value}px`
}))

const contentStyle = computed(() => ({
  maxHeight: isCollapsed.value ? '0' : `${windowHeight.value - 50}px`
}))
</script>

<template>
  <div
    class="floating-window"
    :style="windowStyle"
    @mousemove="handleWindowMouseMove"
    @mouseup="handleWindowMouseUp"
    @mouseleave="handleWindowMouseUp"
  >
    <!-- ウィンドウヘッダー -->
    <div
      class="window-header"
      @mousedown="handleWindowMouseDown"
    >
      <h3 class="window-title">投稿作品</h3>
      <div class="window-controls">
        <button
          class="control-btn"
          @click="toggleCollapse"
          :title="isCollapsed ? '展開' : '折りたたみ'"
        >
          {{ isCollapsed ? '▼' : '▲' }}
        </button>
      </div>
    </div>

    <!-- ウィンドウコンテンツ -->
    <div class="window-content" :style="contentStyle">
      <div v-if="posts.length === 0" class="empty-state">
        投稿作品がありません
      </div>
      <ul v-else class="posts-list">
        <li
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          :class="{ active: currentViewIndex !== -1 && posts[currentViewIndex]?.id === post.id }"
          @click="handlePostClick(post)"
          @contextmenu="handleContextMenu(post.id, post.isOwn, $event)"
        >
          <div class="post-info">
            <span class="post-title">{{ post.title }}</span>
            <span class="post-date">{{ formatDate(post.createdat) }}</span>
          </div>
          <div v-if="post.isOwn" class="post-actions">
            <button
              class="action-btn edit-btn"
              @click="handleEditPost(post, $event)"
              title="編集"
            >
              ✎
            </button>
            <button
              class="action-btn delete-btn"
              @click="handleDeletePost(post.id, $event)"
              title="削除"
            >
              ✕
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 追加ボタン -->
    <div class="window-footer">
      <button class="add-btn" @click="handleAddPost">+ 追加</button>
    </div>

    <!-- リサイズハンドル -->
    <div
      class="resize-handle"
      @mousedown="handleResizeStart"
    />
  </div>
</template>

<style scoped>
.floating-window {
  position: fixed;
  background: #ffffff;
  border: 2px solid #545454;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 200;
  user-select: none;
  min-width: 250px;
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #545454 0%, #3d3d3d 100%);
  color: #ffffff;
  border-radius: 10px 10px 0 0;
  cursor: move;
  border-bottom: 2px solid #545454;
}

.window-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.window-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 200ms ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.window-content {
  flex: 1;
  overflow-y: auto;
  transition: max-height 200ms ease;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
}

.posts-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #545454;
  cursor: pointer;
  transition: all 200ms ease;
}

.post-item:hover {
  background: #e8e8e8;
  transform: translateX(4px);
}

.post-item.active {
  background: #e0e8f5;
  border-left-color: #4a7ba7;
}

.post-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.post-title {
  flex: 1;
  font-size: 0.9rem;
  color: #545454;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-date {
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 200ms ease;
}

.post-item:hover .post-actions {
  opacity: 1;
}

.action-btn {
  background: transparent;
  border: none;
  color: #545454;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 200ms ease;
}

.action-btn:hover {
  background: rgba(84, 84, 84, 0.1);
}

.edit-btn:hover {
  color: #4a7ba7;
}

.delete-btn:hover {
  color: #d9534f;
}

.window-footer {
  padding: 0.75rem;
  border-top: 1px solid #ddd;
  background: #fafafa;
  border-radius: 0 0 10px 10px;
}

.add-btn {
  width: 100%;
  padding: 0.75rem;
  background: #545454;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  font-size: 0.9rem;
}

.add-btn:hover {
  background: #3d3d3d;
  transform: scale(1.02);
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #545454 50%);
  border-radius: 0 0 10px 0;
}

.resize-handle:hover {
  background: linear-gradient(135deg, transparent 50%, #3d3d3d 50%);
}

/* スクロールバーのスタイル */
.window-content::-webkit-scrollbar {
  width: 6px;
}

.window-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.window-content::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.window-content::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
