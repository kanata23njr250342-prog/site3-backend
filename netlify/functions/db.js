/**
 * Netlify Functions用のデータベース管理
 * メモリ上でデータを保持（Netlify環境での永続化は別途実装が必要）
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// メモリ内キャッシュ
let dbCache = {
  notes: [],
  posts: [],
  lastUpdated: new Date().toISOString()
}

// ファイルシステムへのアクセス（オプション）
let fsAvailable = false
let NOTES_FILE, POSTS_FILE

try {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const DATA_DIR = path.join(currentDir, '..', '..', 'data')
  NOTES_FILE = path.join(DATA_DIR, 'notes.json')
  POSTS_FILE = path.join(DATA_DIR, 'posts.json')
  
  // ファイルシステムが利用可能か確認
  if (fs && fs.existsSync && fs.writeFileSync) {
    fsAvailable = true
    
    // ディレクトリ作成
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
    } catch (e) {
      console.warn('Could not create data directory:', e.message)
      fsAvailable = false
    }
    
    // ファイル初期化
    if (fsAvailable) {
      try {
        if (!fs.existsSync(NOTES_FILE)) {
          fs.writeFileSync(NOTES_FILE, JSON.stringify([]))
        }
      } catch (e) {
        console.warn('Could not initialize notes file:', e.message)
      }
      
      try {
        if (!fs.existsSync(POSTS_FILE)) {
          fs.writeFileSync(POSTS_FILE, JSON.stringify([]))
        }
      } catch (e) {
        console.warn('Could not initialize posts file:', e.message)
      }
    }
    
    // 既存ファイルからデータを読み込む
    if (fsAvailable) {
      try {
        const notesData = fs.readFileSync(NOTES_FILE, 'utf-8')
        dbCache.notes = JSON.parse(notesData)
      } catch (e) {
        console.warn('Could not load notes from file:', e.message)
      }
      
      try {
        const postsData = fs.readFileSync(POSTS_FILE, 'utf-8')
        dbCache.posts = JSON.parse(postsData)
      } catch (e) {
        console.warn('Could not load posts from file:', e.message)
      }
    }
  }
} catch (error) {
  console.warn('File system initialization failed:', error.message)
  fsAvailable = false
}

// ファイルにデータを保存（ベストエフォート）
const persistData = () => {
  if (!fsAvailable || !fs || !fs.writeFileSync) return
  
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(dbCache.notes, null, 2))
    fs.writeFileSync(POSTS_FILE, JSON.stringify(dbCache.posts, null, 2))
  } catch (error) {
    console.warn('Could not persist data to file:', error.message)
  }
}

/**
 * メモをマイグレーション
 */
function migrateNote(note) {
  if (note.migrated) return note
  
  return {
    ...note,
    migrated: true
  }
}

/**
 * 投稿作品をマイグレーション
 */
function migratePost(post) {
  if (post.migrated) return post
  
  return {
    ...post,
    migrated: true
  }
}

export function getDb() {
  return {
    // メモ関連
    getNotes: (category) => {
      return dbCache.notes.filter(note => note.category === category)
    },
    addNote: (note) => {
      const migratedNote = migrateNote(note)
      dbCache.notes.push(migratedNote)
      persistData()
      return migratedNote
    },
    updateNote: (id, updates) => {
      const index = dbCache.notes.findIndex(n => n.id === id)
      if (index !== -1) {
        dbCache.notes[index] = {
          ...dbCache.notes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          migrated: true
        }
        persistData()
        return dbCache.notes[index]
      }
      return null
    },
    deleteNote: (id) => {
      const index = dbCache.notes.findIndex(n => n.id === id)
      if (index !== -1) {
        dbCache.notes.splice(index, 1)
        persistData()
        return true
      }
      return false
    },
    getAllNotes: () => dbCache.notes,

    // 投稿作品関連
    getPosts: (category) => {
      return dbCache.posts.filter(post => post.category === category)
    },
    addPost: (post) => {
      const migratedPost = migratePost(post)
      dbCache.posts.push(migratedPost)
      persistData()
      return migratedPost
    },
    updatePost: (id, updates) => {
      const index = dbCache.posts.findIndex(p => p.id === id)
      if (index !== -1) {
        dbCache.posts[index] = {
          ...dbCache.posts[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          migrated: true
        }
        persistData()
        return dbCache.posts[index]
      }
      return null
    },
    deletePost: (id) => {
      const index = dbCache.posts.findIndex(p => p.id === id)
      if (index !== -1) {
        dbCache.posts.splice(index, 1)
        persistData()
        return true
      }
      return false
    },
    getAllPosts: () => dbCache.posts
  }
}
