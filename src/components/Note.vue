<script setup>
/**
 * Note - 個別のメモを表示・編集するコンポーネント
 * @component
 */
import { ref, computed } from 'vue'

/**
 * @typedef {Object} Props
 * @property {string} id - メモID
 * @property {number} x - X座標（キャンバス座標）
 * @property {number} y - Y座標（キャンバス座標）
 * @property {number} width - 幅（px）
 * @property {number} height - 高さ（px）
 * @property {string} content - メモ内容
 * @property {string} author - 作成者名
 * @property {string} color - 背景色
 * @property {string} createdAt - 作成日時
 * @property {boolean} isOwn - 自分のメモかどうか
 * @property {number} zoom - ズームレベル
 * @property {number} panX - パンX値
 * @property {number} panY - パンY値
 * @property {Object} canvasCenter - キャンバス中央座標
 */

const props = defineProps({
  id: String,
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  content: String,
  author: String,
  color: String,
  createdAt: String,
  isOwn: Boolean,
  zoom: {
    type: Number,
    default: 1
  },
  panX: {
    type: Number,
    default: 0
  },
  panY: {
    type: Number,
    default: 0
  },
  canvasCenter: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const emit = defineEmits(['update', 'delete', 'contextmenu', 'drag'])

const isCollapsed = ref(false)
const isResizing = ref(false)
const isDragging = ref(false)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const dragStart = ref({ x: 0, y: 0, startX: 0, startY: 0 })

const localWidth = ref(props.width)
const localHeight = ref(props.height)
const localX = ref(props.x)
const localY = ref(props.y)

const formattedDate = computed(() => {
  // createdAtまたはcreatedatのいずれかを使用
  const dateString = props.createdAt || props.createdat
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const startDrag = (e) => {
  // 右クリック、リサイズハンドル、ボタンからのドラッグは除外
  if (e.button !== 0 || e.target.closest('.note-resize-handle') || e.target.closest('button')) {
    return
  }
  
  // イベント伝播を停止してキャンバスのドラッグと競合しないようにする
  e.stopPropagation()
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    startX: localX.value,
    startY: localY.value
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStart.value.x
  const deltaY = e.clientY - dragStart.value.y

  // キャンバス座標でのドラッグ計算
  // ズームとパンを考慮して、スクリーン座標の変化をキャンバス座標に変換
  const scaledDeltaX = deltaX / props.zoom
  const scaledDeltaY = deltaY / props.zoom

  localX.value = dragStart.value.startX + scaledDeltaX
  localY.value = dragStart.value.startY + scaledDeltaY
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  emit('drag', {
    x: localX.value,
    y: localY.value
  })
}

const startResize = (e) => {
  e.stopPropagation()
  if (isCollapsed.value) return
  isResizing.value = true
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: localWidth.value,
    height: localHeight.value
  }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (e) => {
  if (!isResizing.value) return
  const deltaX = e.clientX - resizeStart.value.x
  const deltaY = e.clientY - resizeStart.value.y
  localWidth.value = Math.max(120, resizeStart.value.width + deltaX)
  localHeight.value = Math.max(120, resizeStart.value.height + deltaY)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  emit('update', {
    width: localWidth.value,
    height: localHeight.value,
    x: localX.value,
    y: localY.value
  })
}

const handleContextMenu = (e) => {
  e.preventDefault()
  e.stopPropagation()
  emit('contextmenu', { x: e.clientX, y: e.clientY })
}
</script>

<template>
  <div
    class="note"
    :style="{
      '--canvas-x': `${localX}px`,
      '--canvas-y': `${localY}px`,
      width: `${localWidth}px`,
      height: isCollapsed ? 'auto' : `${localHeight}px`,
      backgroundColor: color,
      zIndex: isDragging ? 1000 : 10
    }"
    @mousedown.left="startDrag"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="note-header">
      <div class="note-info">
        <span class="note-author">{{ author }}</span>
        <span class="note-date">{{ formattedDate }}</span>
      </div>
      <button
        class="note-collapse-btn"
        @click="isCollapsed = !isCollapsed"
        :title="isCollapsed ? '展開' : '折りたたむ'"
      >
        {{ isCollapsed ? '▼' : '▲' }}
      </button>
    </div>

    <div v-if="!isCollapsed" class="note-content">
      {{ content }}
    </div>

    <div
      v-if="!isCollapsed"
      class="note-resize-handle"
      @mousedown="startResize"
      :title="'ドラッグでリサイズ'"
    />
  </div>
</template>

<style scoped>
.note {
  position: absolute;
  padding: 0.75rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.85rem;
  line-height: 1.4;
  color: #333;
  word-wrap: break-word;
  overflow: hidden;
  cursor: grab;
  transition: box-shadow 200ms ease;
  user-select: none;
  /* キャンバス座標を使用 */
  left: 50%;
  top: 50%;
  transform: translate(calc(-50% + var(--canvas-x, 0px)), calc(-50% + var(--canvas-y, 0px)));
}

.note:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.note-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.note-author {
  font-weight: 600;
  font-size: 0.8rem;
}

.note-date {
  font-size: 0.7rem;
  opacity: 0.7;
}

.note-collapse-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 200ms ease;
}

.note-collapse-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.note-content {
  overflow-y: auto;
  max-height: calc(100% - 2.5rem);
  padding-right: 0.3rem;
}

.note-content::-webkit-scrollbar {
  width: 4px;
}

.note-content::-webkit-scrollbar-track {
  background: transparent;
}

.note-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.note-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.2) 50%);
  border-radius: 0 0 8px 0;
}
</style>
