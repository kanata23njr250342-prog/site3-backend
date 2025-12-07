/**
 * Netlify Functions用のデータベース管理
 * ローカルファイルシステムに保存（Netlify環境では/tmp/ディレクトリを使用）
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// メモリ内キャッシュ（パフォーマンス向上用）
let dbCache = {
  notes: [],
  posts: [],
  lastUpdated: new Date().toISOString()
}

// Netlify環境では/tmp/を使用、ローカル開発ではdataディレクトリを使用
const DATA_DIR = process.env.NETLIFY ? '/tmp/site3-data' : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data')
const NOTES_FILE = path.join(DATA_DIR, 'notes.json')
const POSTS_FILE = path.join(DATA_DIR, 'posts.json')

console.log('📁 Data directory:', DATA_DIR)
console.log('🌍 Environment:', process.env.NETLIFY ? 'Netlify' : 'Local')

// ディレクトリとファイルの初期化
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log('✅ Data directory created')
  }
  
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify([]))
    console.log('✅ Notes file created')
  }
  
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([]))
    console.log('✅ Posts file created')
  }
  
  // 既存データを読み込む
  try {
    const notesData = fs.readFileSync(NOTES_FILE, 'utf-8')
    dbCache.notes = JSON.parse(notesData)
    console.log('✅ Loaded', dbCache.notes.length, 'notes from file')
  } catch (e) {
    console.warn('⚠️ Could not load notes:', e.message)
  }
  
  try {
    const postsData = fs.readFileSync(POSTS_FILE, 'utf-8')
    dbCache.posts = JSON.parse(postsData)
    console.log('✅ Loaded', dbCache.posts.length, 'posts from file')
  } catch (e) {
    console.warn('⚠️ Could not load posts:', e.message)
  }
} catch (error) {
  console.error('❌ File system initialization failed:', error.message)
}

// ファイルにデータを保存
const persistData = () => {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(dbCache.notes, null, 2))
    fs.writeFileSync(POSTS_FILE, JSON.stringify(dbCache.posts, null, 2))
    console.log('💾 Data persisted to file')
  } catch (error) {
    console.error('❌ Could not persist data:', error.message)
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
