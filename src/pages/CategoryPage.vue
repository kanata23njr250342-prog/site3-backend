<script setup>
/**
 * CategoryPage - 無限キャンバスベースのカテゴリー別作品表示
 * @component
 */
import { useRouter } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import Note from '../components/Note.vue'
import FloatingPostsList from '../components/FloatingPostsList.vue'
import { fetchNotes, createNote, updateNote, deleteNote } from '../api/notesApi.js'
import { fetchPosts, createPost, updatePost, deletePost as deletePostApi } from '../api/postsApi.js'
import { loadDeletedExampleNoteIds, saveDeletedExampleNoteIds } from '../utils/storage.js'
import { screenToCanvas } from '../utils/coordinates.js'
import { getCurrentUserId, isCurrentUser } from '../utils/auth.js'

const router = useRouter()
const props = defineProps({
  name: String
})

// ===== キャンバス状態 =====
const canvasContainer = ref(null)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const rightClickStartTime = ref(0)
const rightClickStartX = ref(0)
const rightClickStartY = ref(0)
const isRightClickDragging = ref(false)
const rightClickStartZoom = ref(1)
const rightClickStartPanX = ref(0)
const rightClickStartPanY = ref(0)

// 中ボタンスクロール用
let wheelStartZoom = 1
let wheelStartPanX = 0
let wheelStartPanY = 0
let wheelCumulativeDelta = 0

// ===== データ状態 =====
const notes = ref([])
const contextMenu = ref(null)
const showNoteDialog = ref(false)
const editingNote = ref(null)
const newNoteForm = ref({ author: '', content: '' })
const deletedExampleNoteIds = ref(new Set())

const showPostDialog = ref(false)
const editingPost = ref(null)
const newPostForm = ref({ title: '', file: null, preview: null })

// ===== 画像拡大表示 =====
const expandedImage = ref(null)

const viewHistory = ref([])
const currentViewIndex = ref(-1)

// ===== メモカラー =====
const noteColors = [
  '#fffacd', '#fff9e6', '#ffe6e6', '#f0e6ff',
  '#e6f3ff', '#e6ffe6', '#fff0e6', '#ffe6f0',
  '#f0fff0', '#fff0f0', '#f0f0ff', '#fffef0'
]

// ===== 投稿作品管理 =====
const postsByCategory = ref({
  '背景': [],
  'キャラクター': [],
  '小物': [],
  'アニメーション': []
})

// ===== 作品例メモ =====
const exampleNotesByCategory = {
  '背景': [
    {
      id: 'example-bg-1',
      content: 'ふわっと感がめっちゃきれいです！光の当たり方も自然でいい！',
      author: 'ユーザーA',
      x: 100,
      y: -200
    },
    {
      id: 'example-bg-2',
      content: '雲の形がすごくリアル！！！！もう少し透明度を出すともっといいかも！',
      author: 'ユーザーB',
      x: 200,
      y: 170
    },
    {
      id: 'example-bg-3',
      content: '雰囲気すてき！背景の青を少しグラデにすると空っぽさUPかも！？',
      author: 'ユーザーC',
      x: -230,
      y: 100
    }
  ],
  'キャラクター': [
    {
      id: 'example-char-1',
      content: '超絶かわいい！水分子に似てる！目もまんまるで最高です！！！',
      author: 'ユーザーA',
      x: 100,
      y: -200
    },
    {
      id: 'example-char-2',
      content: '色合いめっちゃよきです！でも背景の色も設定したらもっといいと思います！',
      author: 'ユーザーB',
      x: 200,
      y: 170
    },
    {
      id: 'example-char-3',
      content: '目がかわいい！ライトの当て方なんだけど色まで変えられるから試してほしい！',
      author: 'ユーザーC',
      x: -230,
      y: 100
    }
  ],
  '小物': [
    {
      id: 'example-props-1',
      content: '液体の色味すてき！星のきらめきが夜空みたいでめちゃいい！',
      author: 'ユーザーA',
      x: 100,
      y: -200
    },
    {
      id: 'example-props-2',
      content: 'ガラスの反射がすごいリアル！背景をもう少し暗めにすると雰囲気出そう！',
      author: 'ユーザーB',
      x: 200,
      y: 170
    },
    {
      id: 'example-props-3',
      content: 'シンプルで上品！液体の揺らぎを足すと、さらに生き生きしそう！',
      author: 'ユーザーC',
      x: -230,
      y: 100
    }
  ],
  'アニメーション': [
    {
      id: 'example-anim-1',
      content: 'ドミノの倒れかたが自然でめっちゃ良き！ただ鮮やかさが低いからそこを改善したらいいかも！',
      author: 'ユーザーA',
      x: 240,
      y: -300
    },
    {
      id: 'example-anim-2',
      content: 'ちゃんと工夫されていて素敵です。でももう少し要素を複雑にすることで素敵な作品になると思います。',
      author: 'ユーザーB',
      x: 420,
      y: 190
    },
    {
      id: 'example-anim-3',
      content: 'いろ可愛い！段差とかつけたらもっと面白くなるかもアニメーション学ぶなら〇〇さんがおすすめ！',
      author: 'ユーザーC',
      x: -420,
      y: 100
    }
  ]
}

const mockArtworks = {
  '背景': {
    type: 'image',
    src: '/background_artwork.webp',
    description: '自然風景や都市背景などの作品例'
  },
  'キャラクター': {
    type: 'image',
    src: '/character_artwork.webp',
    description: 'キャラクターモデルの作品例'
  },
  '小物': {
    type: 'image',
    src: '/props_artwork.webp',
    description: '小道具やアクセサリーの作品例'
  },
  'アニメーション': {
    type: 'video',
    src: '/animation_artwork.mp4',
    poster: '/animation_artwork.webp',
    description: 'アニメーション作品の例'
  }
}

// ===== Computed =====
const currentArtwork = computed(() => mockArtworks[props.name] || {})

const currentPost = computed(() => {
  if (currentViewIndex.value === -1) return null
  return viewHistory.value[currentViewIndex.value]
})

const displayedNotes = computed(() => {
  if (currentViewIndex.value === -1) {
    return notes.value.filter(note => !note.postId)
  } else if (currentPost.value) {
    return notes.value.filter(note => note.postId === currentPost.value.id)
  } else {
    return []
  }
})

const displayedPosts = computed(() => {
  return postsByCategory.value[props.name] || []
})

// ===== ナビゲーション =====
const goBack = () => {
  router.push({ name: 'Home' })
}

const viewPost = (post) => {
  const existingIndex = viewHistory.value.findIndex(p => p.id === post.id)
  if (existingIndex !== -1) {
    currentViewIndex.value = existingIndex
  } else {
    viewHistory.value.push(post)
    currentViewIndex.value = viewHistory.value.length - 1
  }
}

const goToPreviousPost = () => {
  if (currentViewIndex.value > -1) {
    currentViewIndex.value--
  }
}

const goToNextPost = () => {
  if (currentViewIndex.value < viewHistory.value.length - 1) {
    currentViewIndex.value++
  }
}

// ===== ユーティリティ =====
const getRandomColor = () => {
  return noteColors[Math.floor(Math.random() * noteColors.length)]
}

const getCanvasCenter = () => {
  if (!canvasContainer.value) return { x: 0, y: 0 }
  return {
    x: canvasContainer.value.clientWidth / 2,
    y: canvasContainer.value.clientHeight / 2
  }
}

// ===== キャンバス操作 =====
const handleCanvasMouseDown = (e) => {
  // メモやボタン、浮遊ウィンドウをクリックした場合はスキップ
  if (e.target.closest('.note') || e.target.closest('.floating-window') || e.target.closest('.navigation-overlay')) {
    return
  }

  if (e.button === 0 || e.button === 1) {
    // 左クリック or 中クリック: パン開始
    isDragging.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
  } else if (e.button === 2) {
    // 右クリック: ズーム準備（ドラッグで確定）
    e.preventDefault()
    rightClickStartTime.value = Date.now()
    rightClickStartX.value = e.clientX
    rightClickStartY.value = e.clientY
    rightClickStartZoom.value = zoom.value
    rightClickStartPanX.value = panX.value
    rightClickStartPanY.value = panY.value
    isRightClickDragging.value = false
  }
}

const handleCanvasMouseMove = (e) => {
  if (isDragging.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    panX.value += deltaX
    panY.value += deltaY
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
  } else if (rightClickStartTime.value > 0) {
    // 右クリック長押し中のドラッグ判定
    const deltaX = Math.abs(e.clientX - rightClickStartX.value)
    const deltaY = Math.abs(e.clientY - rightClickStartY.value)
    
    if (deltaX > 5 || deltaY > 5) {
      // ドラッグが開始された
      isRightClickDragging.value = true
      
      // スクロール開始位置からの累積Y移動距離
      const cumulativeDeltaY = e.clientY - rightClickStartY.value
      
      // 累積移動距離に基づいてズームレベルを計算
      // 上方向（負）で拡大、下方向（正）で縮小
      const zoomChangePerPixel = 0.001
      const targetZoom = rightClickStartZoom.value * Math.exp(-cumulativeDeltaY * zoomChangePerPixel)
      
      if (targetZoom >= 0.5 && targetZoom <= 5) {
        // 右クリックズーム: 画面の中心を基準にズーム
        const canvasRect = canvasContainer.value?.getBoundingClientRect()
        if (canvasRect) {
          const screenCenterX = canvasRect.width / 2
          const screenCenterY = canvasRect.height / 2
          
          // ズーム比率（開始時からの相対値）
          const zoomRatio = targetZoom / rightClickStartZoom.value
          
          // パン調整（画面中心を基準に）
          const panDeltaX = screenCenterX * (1 - zoomRatio)
          const panDeltaY = screenCenterY * (1 - zoomRatio)
          
          // パン値を開始時の値から計算（毎フレーム加算ではなく）
          panX.value = rightClickStartPanX.value + panDeltaX
          panY.value = rightClickStartPanY.value + panDeltaY
          
          zoom.value = targetZoom
        }
      }
    }
  }
}

const handleCanvasMouseUp = (e) => {
  if (isDragging.value) {
    isDragging.value = false
  } else if (rightClickStartTime.value > 0 && !isRightClickDragging.value) {
    // 右クリックで長押しもドラッグもしなかった場合: コンテキストメニュー表示
    const canvasContent = document.querySelector('.canvas-content')
    if (!canvasContent) {
      rightClickStartTime.value = 0
      return
    }
    
    const rect = canvasContent.getBoundingClientRect()
    const center = getCanvasCenter()
    
    const canvasCoords = screenToCanvas(
      rightClickStartX.value - (canvasContainer.value?.getBoundingClientRect().left || 0),
      rightClickStartY.value - (canvasContainer.value?.getBoundingClientRect().top || 0),
      zoom.value,
      panX.value,
      panY.value,
      center.x,
      center.y
    )
    
    contextMenu.value = {
      x: rightClickStartX.value,
      y: rightClickStartY.value,
      canvasX: canvasCoords.x,
      canvasY: canvasCoords.y,
      type: 'canvas'
    }
  }
  
  rightClickStartTime.value = 0
  isRightClickDragging.value = false
}

const handleCanvasWheel = (e) => {
  e.preventDefault()
  
  // スクロール開始時の値を記録（最初のスクロール時のみ）
  if (wheelCumulativeDelta === 0) {
    wheelStartZoom = zoom.value
    wheelStartPanX = panX.value
    wheelStartPanY = panY.value
  }
  
  // 累積スクロール量を更新
  wheelCumulativeDelta += e.deltaY
  
  // 累積スクロール量に基づいてズームレベルを計算
  // 上方向（負）で拡大、下方向（正）で縮小
  const zoomChangePerPixel = 0.001
  const targetZoom = wheelStartZoom * Math.exp(-wheelCumulativeDelta * zoomChangePerPixel)
  
  if (targetZoom >= 0.5 && targetZoom <= 5) {
    // 中ボタンスクロール: カーソル位置を中心にズーム
    const canvasRect = canvasContainer.value?.getBoundingClientRect()
    if (canvasRect) {
      const cursorX = e.clientX - canvasRect.left
      const cursorY = e.clientY - canvasRect.top
      const centerX = canvasRect.width / 2
      const centerY = canvasRect.height / 2
      
      // カーソルからの相対位置
      const relX = cursorX - centerX
      const relY = cursorY - centerY
      
      // ズーム比率（開始時からの相対値）
      const zoomRatio = targetZoom / wheelStartZoom
      
      // パン調整（カーソル位置を中心に）
      const panDeltaX = relX * (1 - zoomRatio)
      const panDeltaY = relY * (1 - zoomRatio)
      
      // パン値を開始時の値から計算（毎フレーム加算ではなく）
      panX.value = wheelStartPanX + panDeltaX
      panY.value = wheelStartPanY + panDeltaY
      
      zoom.value = targetZoom
    }
  }
  
  // スクロール終了時に累積値をリセット（スクロール停止を検出）
  setTimeout(() => {
    wheelCumulativeDelta = 0
  }, 150)
}

// ===== メモ操作 =====
const addNote = async () => {
  if (!newNoteForm.value.content?.trim()) {
    alert('メモの内容を入力してください')
    return
  }

  if (!contextMenu.value || contextMenu.value.canvasX === undefined) {
    alert('メモを配置する位置を選択してください')
    return
  }

  try {
    const isPostView = currentViewIndex.value !== -1 && currentPost.value
    
    const noteData = {
      id: Date.now().toString(),
      category: props.name,
      x: contextMenu.value.canvasX,
      y: contextMenu.value.canvasY,
      width: 200,
      height: 200,
      content: newNoteForm.value.content.trim(),
      author: newNoteForm.value.author?.trim() || '匿名',
      color: getRandomColor(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOwn: true,
      postId: isPostView ? currentPost.value.id : undefined,
      isExample: false,
      migrated: true
    }
    
    if (isPostView) {
      const savedNote = await createNote(noteData)
      notes.value.push({
        ...savedNote,
        isOwn: true,
        isExample: false
      })
    } else {
      notes.value.push(noteData)
    }
    
    showNoteDialog.value = false
    contextMenu.value = null
    newNoteForm.value = { author: '', content: '' }
  } catch (error) {
    console.error('Error adding note:', error)
    alert(`メモの保存に失敗しました: ${error.message}`)
  }
}

const editNote = (note) => {
  editingNote.value = { ...note }
}

const saveEditNote = async () => {
  try {
    const note = notes.value.find(n => n.id === editingNote.value.id)
    const updates = {
      content: editingNote.value.content,
      author: editingNote.value.author
    }
    
    if (note && !note.isExample && note.postId) {
      await updateNote(editingNote.value.id, updates)
    }
    
    const index = notes.value.findIndex(n => n.id === editingNote.value.id)
    if (index !== -1) {
      notes.value[index].content = editingNote.value.content
      notes.value[index].author = editingNote.value.author
    }
    
    editingNote.value = null
    contextMenu.value = null
  } catch (error) {
    alert('メモの更新に失敗しました')
    console.error(error)
  }
}

const deleteNoteHandler = async (noteId) => {
  if (!noteId) {
    console.error('Note ID is required')
    return
  }

  try {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) {
      throw new Error('メモが見つかりません')
    }
    
    if (!note.isExample && note.postId) {
      await deleteNote(noteId)
    }
    
    if (note.isExample) {
      deletedExampleNoteIds.value.add(noteId)
      saveDeletedExampleNoteIds(deletedExampleNoteIds.value)
    }
    
    notes.value = notes.value.filter(n => n.id !== noteId)
    contextMenu.value = null
  } catch (error) {
    console.error('Error deleting note:', error)
    alert(`メモの削除に失敗しました: ${error.message}`)
  }
}

const handleNoteContextMenu = (noteId, isOwn, position) => {
  const note = notes.value.find(n => n.id === noteId)
  if (!note) return

  contextMenu.value = {
    x: position.x,
    y: position.y,
    noteId,
    isOwn,
    type: 'note'
  }
}

const handleNoteUpdate = async (noteId, updates) => {
  const note = notes.value.find(n => n.id === noteId)
  if (note) {
    Object.assign(note, updates)
    if (!note.isExample && note.postId) {
      try {
        await updateNote(noteId, updates)
      } catch (error) {
        console.error('Failed to update note position:', error)
      }
    }
  }
}

const handleNoteDrag = async (noteId, position) => {
  const note = notes.value.find(n => n.id === noteId)
  if (note) {
    note.x = position.x
    note.y = position.y
    if (!note.isExample && note.postId) {
      try {
        await updateNote(noteId, { x: position.x, y: position.y })
      } catch (error) {
        console.error('Failed to update note position:', error)
      }
    }
  }
}

// ===== 投稿作品操作 =====
const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  newPostForm.value.file = file

  const reader = new FileReader()
  reader.onload = (event) => {
    newPostForm.value.preview = event.target?.result
  }
  reader.readAsDataURL(file)
}

const addPost = async () => {
  if (!newPostForm.value.title?.trim()) {
    alert('タイトルを入力してください')
    return
  }

  if (!newPostForm.value.file) {
    alert('画像/動画を選択してください')
    return
  }

  try {
    const formData = new FormData()
    formData.append('title', newPostForm.value.title.trim())
    formData.append('category', props.name)
    formData.append('file', newPostForm.value.file)

    const savedPost = await createPost(formData)

    postsByCategory.value[props.name].push({
      ...savedPost,
      isOwn: true
    })

    showPostDialog.value = false
    newPostForm.value = { title: '', file: null, preview: null }
  } catch (error) {
    console.error('Error adding post:', error)
    alert(`投稿作品の保存に失敗しました: ${error.message}`)
  }
}

const deletePost = async (postId) => {
  if (!postId) {
    console.error('Post ID is required')
    return
  }

  try {
    await deletePostApi(postId)

    postsByCategory.value[props.name] = postsByCategory.value[props.name].filter(p => p.id !== postId)
    
    const historyIndex = viewHistory.value.findIndex(p => p.id === postId)
    if (historyIndex !== -1) {
      viewHistory.value.splice(historyIndex, 1)
      
      if (currentViewIndex.value === historyIndex) {
        if (viewHistory.value.length > 0) {
          currentViewIndex.value = Math.max(0, historyIndex - 1)
        } else {
          currentViewIndex.value = -1
        }
      } else if (currentViewIndex.value > historyIndex) {
        currentViewIndex.value--
      }
    }
    
    contextMenu.value = null
  } catch (error) {
    alert('投稿作品の削除に失敗しました')
    console.error(error)
  }
}

const editPost = (post) => {
  editingPost.value = { ...post }
  const previewUrl = post.src.startsWith('http') ? post.src : `http://localhost:3000${post.src}`
  newPostForm.value = { title: post.title, file: null, preview: previewUrl }
  showPostDialog.value = true
}

const saveEditPost = async () => {
  if (!editingPost.value?.title?.trim()) {
    alert('タイトルを入力してください')
    return
  }

  try {
    await updatePost(editingPost.value.id, { title: editingPost.value.title.trim() })

    const postIndex = postsByCategory.value[props.name].findIndex(p => p.id === editingPost.value.id)
    if (postIndex !== -1) {
      postsByCategory.value[props.name][postIndex].title = editingPost.value.title
    }

    const historyIndex = viewHistory.value.findIndex(p => p.id === editingPost.value.id)
    if (historyIndex !== -1) {
      viewHistory.value[historyIndex].title = editingPost.value.title
    }

    showPostDialog.value = false
    editingPost.value = null
    newPostForm.value = { title: '', file: null, preview: null }
  } catch (error) {
    console.error('Error updating post:', error)
    alert(`投稿作品の更新に失敗しました: ${error.message}`)
  }
}

const handlePostContextMenu = (postId, isOwn, e) => {
  e.preventDefault()
  e.stopPropagation()

  contextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    postId,
    isOwn,
    type: 'post'
  }
}

// ===== 画像拡大表示 =====
const handleImageClick = (imageSrc) => {
  expandedImage.value = imageSrc
}

// ===== ライフサイクル =====
onMounted(async () => {
  try {
    if (!props.name) {
      throw new Error('カテゴリー名が指定されていません')
    }

    // キャンバスの初期位置を設定（中心をキャンバスの中心に）
    zoom.value = 1
    panX.value = 0
    panY.value = 0

    deletedExampleNoteIds.value = loadDeletedExampleNoteIds()

    let backendNotes = []
    try {
      const fetchedNotes = await fetchNotes(props.name)
      backendNotes = fetchedNotes.map(note => ({
        ...note,
        isOwn: isCurrentUser(note.authorId),
        isExample: false
      }))
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    }

    const exampleNotes = (exampleNotesByCategory[props.name] || [])
      .filter(note => !deletedExampleNoteIds.value.has(note.id))
      .map(note => ({
        ...note,
        width: 200,
        height: 200,
        color: getRandomColor(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOwn: true,
        isExample: true,
        migrated: true,
        authorId: getCurrentUserId()
      }))

    notes.value = [...exampleNotes, ...backendNotes]

    try {
      const posts = await fetchPosts(props.name)
      postsByCategory.value[props.name] = posts.map(post => ({
        ...post,
        isOwn: isCurrentUser(post.authorId)
      }))
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})

onUnmounted(() => {
  // クリーンアップ
})
</script>

<template>
  <main class="page">
    <header class="header">
      <button class="back-btn" @click="goBack">← 戻る</button>
      <h1 class="title">{{ name }}</h1>
    </header>

    <div class="main-container">
      <!-- キャンバス領域 -->
      <div
        ref="canvasContainer"
        class="canvas"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @wheel="handleCanvasWheel"
        @contextmenu.prevent
      >
        <!-- キャンバス内容 -->
        <div
          class="canvas-content"
          :style="{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`
          }"
        >
          <!-- 作品表示 -->
          <div class="artwork-display">
            <img
              v-if="currentArtwork.type === 'image' && currentViewIndex === -1"
              :src="currentArtwork.src"
              :alt="`${name}の作品例`"
              class="artwork-media"
              @click="handleImageClick(currentArtwork.src)"
            />
            <video
              v-else-if="currentArtwork.type === 'video' && currentViewIndex === -1"
              :poster="currentArtwork.poster"
              controls
              class="artwork-media"
            >
              <source :src="currentArtwork.src" type="video/mp4" />
            </video>

            <img
              v-if="currentViewIndex !== -1 && name !== 'アニメーション'"
              :src="`http://localhost:3000${currentPost.src}`"
              :alt="currentPost.title"
              class="artwork-media"
              @click="handleImageClick(`http://localhost:3000${currentPost.src}`)"
            />
            <video
              v-else-if="currentViewIndex !== -1 && name === 'アニメーション'"
              :src="`http://localhost:3000${currentPost.src}`"
              controls
              class="artwork-media"
            />
          </div>

          <!-- メモ表示 -->
          <Note
            v-for="note in displayedNotes"
            :key="note.id"
            :id="note.id"
            :x="note.x"
            :y="note.y"
            :width="note.width"
            :height="note.height"
            :content="note.content"
            :author="note.author"
            :color="note.color"
            :created-at="note.createdAt"
            :is-own="note.isOwn"
            :zoom="zoom"
            :pan-x="panX"
            :pan-y="panY"
            :canvas-center="getCanvasCenter()"
            @update="(updates) => handleNoteUpdate(note.id, updates)"
            @drag="(position) => handleNoteDrag(note.id, position)"
            @contextmenu="(e) => handleNoteContextMenu(note.id, note.isOwn, e)"
          />
        </div>
      </div>

      <!-- 投稿作品リスト（浮遊ウィンドウ） -->
      <FloatingPostsList
        :posts="displayedPosts"
        :current-view-index="currentViewIndex"
        @view-post="viewPost"
        @add-post="showPostDialog = true"
        @edit-post="editPost"
        @delete-post="deletePost"
        @context-menu="handlePostContextMenu"
      />

      <!-- ナビゲーション -->
      <div class="navigation-overlay">
        <button
          class="nav-btn"
          @click="goToPreviousPost"
          :disabled="currentViewIndex <= -1"
          title="前の作品"
        >
          ← 前へ
        </button>
        <span class="nav-title">
          {{ currentViewIndex === -1 ? '作品例' : currentPost.title }}
        </span>
        <button
          class="nav-btn"
          @click="goToNextPost"
          :disabled="currentViewIndex >= viewHistory.length - 1"
          title="次の作品"
        >
          次へ →
        </button>
      </div>
    </div>

    <!-- コンテキストメニュー -->
    <div
      v-if="contextMenu"
      class="context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <template v-if="contextMenu.type === 'note' && contextMenu.isOwn">
        <button
          class="context-menu-item"
          @click="editNote(notes.find(n => n.id === contextMenu.noteId)); contextMenu = null"
        >
          メモを編集
        </button>
        <button
          class="context-menu-item"
          @click="deleteNoteHandler(contextMenu.noteId)"
        >
          メモを削除
        </button>
      </template>
      <template v-else-if="contextMenu.type === 'post' && contextMenu.isOwn">
        <button
          class="context-menu-item"
          @click="editPost(displayedPosts.find(p => p.id === contextMenu.postId)); contextMenu = null"
        >
          投稿作品を編集
        </button>
        <button
          class="context-menu-item"
          @click="deletePost(contextMenu.postId)"
        >
          投稿作品を削除
        </button>
      </template>
      <template v-else-if="contextMenu.type === 'canvas'">
        <button
          class="context-menu-item"
          @click="showNoteDialog = true"
        >
          メモを追加
        </button>
      </template>
    </div>

    <!-- メモ追加/編集ダイアログ -->
    <div v-if="showNoteDialog || editingNote" class="dialog-overlay" @click.self="showNoteDialog = false; editingNote = null; contextMenu = null">
      <div class="dialog">
        <h3 class="dialog-title">
          {{ editingNote ? 'メモを編集' : 'メモを追加' }}
        </h3>
        <div class="dialog-form">
          <div class="form-group">
            <label>名前</label>
            <input
              :value="editingNote ? editingNote.author : newNoteForm.author"
              @input="(e) => editingNote ? (editingNote.author = e.target.value) : (newNoteForm.author = e.target.value)"
              type="text"
              placeholder="名前を入力"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>メモの内容</label>
            <textarea
              :value="editingNote ? editingNote.content : newNoteForm.content"
              @input="(e) => editingNote ? (editingNote.content = e.target.value) : (newNoteForm.content = e.target.value)"
              placeholder="メモを入力"
              class="form-textarea"
              rows="6"
            />
          </div>
        </div>
        <div class="dialog-actions">
          <button
            class="dialog-btn dialog-btn-cancel"
            @click="showNoteDialog = false; editingNote = null"
          >
            キャンセル
          </button>
          <button
            class="dialog-btn dialog-btn-submit"
            @click="editingNote ? saveEditNote() : addNote()"
          >
            {{ editingNote ? '保存' : '追加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 投稿作品追加/編集ダイアログ -->
    <div v-if="showPostDialog" class="dialog-overlay" @click.self="showPostDialog = false; editingPost = null; newPostForm = { title: '', file: null, preview: null }">
      <div class="dialog">
        <h3 class="dialog-title">{{ editingPost ? '投稿作品を編集' : '投稿作品を追加' }}</h3>
        <div class="dialog-form">
          <div class="form-group">
            <label>タイトル</label>
            <input
              :value="editingPost ? editingPost.title : newPostForm.title"
              @input="(e) => editingPost ? (editingPost.title = e.target.value) : (newPostForm.title = e.target.value)"
              type="text"
              placeholder="作品のタイトルを入力"
            />
          </div>
          <div v-if="!editingPost" class="form-group">
            <label>{{ name === 'アニメーション' ? '動画' : '画像' }}</label>
            <input
              type="file"
              :accept="name === 'アニメーション' ? 'video/*' : 'image/*'"
              @change="handleFileSelect"
            />
          </div>
          <div v-if="newPostForm.preview" class="preview">
            <img v-if="name !== 'アニメーション'" :src="newPostForm.preview" alt="プレビュー" />
            <video v-else :src="newPostForm.preview" controls />
          </div>
        </div>
        <div class="dialog-actions">
          <button
            class="dialog-btn dialog-btn-cancel"
            @click="showPostDialog = false; editingPost = null; newPostForm = { title: '', file: null, preview: null }"
          >
            キャンセル
          </button>
          <button
            class="dialog-btn dialog-btn-submit"
            @click="editingPost ? saveEditPost() : addPost()"
          >
            {{ editingPost ? '保存' : '投稿' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 画像拡大表示 -->
    <div
      v-if="expandedImage"
      class="image-modal-overlay"
      @click="expandedImage = null"
    >
      <div class="image-modal" @click.stop>
        <button
          class="image-modal-close"
          @click="expandedImage = null"
          title="閉じる"
        >
          ✕
        </button>
        <img :src="expandedImage" :alt="expandedImage" class="image-modal-content" />
      </div>
    </div>

    <!-- オーバーレイ -->
    <div
      v-if="contextMenu"
      class="overlay"
      @click="contextMenu = null"
    />
  </main>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #c1d0e8;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.back-btn {
  background: transparent;
  border: 2px solid #545454;
  color: #545454;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.back-btn:hover {
  background: #545454;
  color: #ffffff;
}

.title {
  font-size: 2rem;
  color: #545454;
  margin: 0;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.main-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8eef5 0%, #d5dce8 100%);
  cursor: grab;
  overflow: hidden;
  position: relative;
}

.canvas:active {
  cursor: grabbing;
}

.canvas-content {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  margin-left: -50%;
  margin-top: -50%;
  transform-origin: 50% 50%;
}

.artwork-display {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  z-index: 1;
}

.artwork-media {
  max-width: 600px;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.navigation-overlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
}

.nav-btn {
  background: #f0f0f0;
  border: 1px solid #d0d0d0;
  color: #545454;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.nav-btn:hover:not(:disabled) {
  background: #e0e0e0;
  border-color: #b0b0b0;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-title {
  min-width: 200px;
  text-align: center;
  font-size: 1rem;
  color: #545454;
  font-weight: 600;
}

/* コンテキストメニュー */
.context-menu {
  position: fixed;
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
}

.context-menu-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  color: #545454;
  transition: background 200ms ease;
}

.context-menu-item:first-child {
  border-radius: 8px 8px 0 0;
}

.context-menu-item:last-child {
  border-radius: 0 0 8px 8px;
}

.context-menu-item:hover {
  background: #f5f5f5;
}

/* ダイアログ */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.dialog {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.dialog-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
  color: #545454;
  font-weight: 700;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #545454;
  font-size: 0.9rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #545454;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #545454;
  box-shadow: 0 0 0 3px rgba(84, 84, 84, 0.1);
}

.form-textarea {
  resize: vertical;
}

.preview {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 300px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview img,
.preview video {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.form-group input[type="file"] {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #545454;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  font-size: 0.9rem;
}

.dialog-btn-cancel {
  background: #f5f5f5;
  color: #545454;
}

.dialog-btn-cancel:hover {
  background: #e8e8e8;
}

.dialog-btn-submit {
  background: #545454;
  color: #ffffff;
}

.dialog-btn-submit:hover {
  background: #3d3d3d;
}

/* 画像拡大表示 */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.image-modal {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.image-modal-content {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.image-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #545454;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms ease;
  z-index: 2001;
}

.image-modal-close:hover {
  background: #3d3d3d;
  transform: scale(1.1);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

@media (max-width: 768px) {
  .title {
    font-size: 1.5rem;
  }

  .header {
    gap: 1rem;
  }
}
</style>
