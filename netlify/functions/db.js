/**
 * Netlify Functions用のデータベース管理
 * ローカルファイルシステムにJSONファイルとして保存
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(currentDir, '..', '..', 'data')
const NOTES_FILE = path.join(DATA_DIR, 'notes.json')
const POSTS_FILE = path.join(DATA_DIR, 'posts.json')

// データディレクトリが存在しなければ作成
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// ファイルが存在しなければ初期化
const initializeFiles = () => {
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify([]))
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([]))
  }
}

initializeFiles()

// ファイルからデータを読み込む
const loadNotes = () => {
  try {
    const data = fs.readFileSync(NOTES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading notes:', error)
    return []
  }
}

const loadPosts = () => {
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading posts:', error)
    return []
  }
}

// ファイルにデータを保存
const saveNotes = (notes) => {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2))
  } catch (error) {
    console.error('Error saving notes:', error)
  }
}

const savePosts = (posts) => {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2))
  } catch (error) {
    console.error('Error saving posts:', error)
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
      const notes = loadNotes()
      return notes.filter(note => note.category === category)
    },
    addNote: (note) => {
      const notes = loadNotes()
      const migratedNote = migrateNote(note)
      notes.push(migratedNote)
      saveNotes(notes)
      return migratedNote
    },
    updateNote: (id, updates) => {
      const notes = loadNotes()
      const index = notes.findIndex(n => n.id === id)
      if (index !== -1) {
        notes[index] = {
          ...notes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          migrated: true
        }
        saveNotes(notes)
        return notes[index]
      }
      return null
    },
    deleteNote: (id) => {
      const notes = loadNotes()
      const index = notes.findIndex(n => n.id === id)
      if (index !== -1) {
        notes.splice(index, 1)
        saveNotes(notes)
        return true
      }
      return false
    },
    getAllNotes: () => loadNotes(),

    // 投稿作品関連
    getPosts: (category) => {
      const posts = loadPosts()
      return posts.filter(post => post.category === category)
    },
    addPost: (post) => {
      const posts = loadPosts()
      const migratedPost = migratePost(post)
      posts.push(migratedPost)
      savePosts(posts)
      return migratedPost
    },
    updatePost: (id, updates) => {
      const posts = loadPosts()
      const index = posts.findIndex(p => p.id === id)
      if (index !== -1) {
        posts[index] = {
          ...posts[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          migrated: true
        }
        savePosts(posts)
        return posts[index]
      }
      return null
    },
    deletePost: (id) => {
      const posts = loadPosts()
      const index = posts.findIndex(p => p.id === id)
      if (index !== -1) {
        posts.splice(index, 1)
        savePosts(posts)
        return true
      }
      return false
    },
    getAllPosts: () => loadPosts()
  }
}
