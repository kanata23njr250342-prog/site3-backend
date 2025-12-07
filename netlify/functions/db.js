/**
 * Netlify Functions用のデータベース管理
 * メモリ上でデータを保持（本番環境ではデータベースサービスの使用を推奨）
 */

let dbData = {
  notes: [],
  posts: [],
  version: '2.0'
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
      return dbData.notes.filter(note => note.category === category)
    },
    addNote: (note) => {
      const migratedNote = migrateNote(note)
      dbData.notes.push(migratedNote)
      return migratedNote
    },
    updateNote: (id, updates) => {
      const index = dbData.notes.findIndex(n => n.id === id)
      if (index !== -1) {
        dbData.notes[index] = {
          ...dbData.notes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          migrated: true
        }
        return dbData.notes[index]
      }
      return null
    },
    deleteNote: (id) => {
      const index = dbData.notes.findIndex(n => n.id === id)
      if (index !== -1) {
        dbData.notes.splice(index, 1)
        return true
      }
      return false
    },
    getAllNotes: () => dbData.notes,

    // 投稿作品関連
    getPosts: (category) => {
      return dbData.posts.filter(post => post.category === category)
    },
    addPost: (post) => {
      const migratedPost = migratePost(post)
      dbData.posts.push(migratedPost)
      return migratedPost
    },
    updatePost: (id, updates) => {
      const index = dbData.posts.findIndex(p => p.id === id)
      if (index !== -1) {
        dbData.posts[index] = {
          ...dbData.posts[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          migrated: true
        }
        return dbData.posts[index]
      }
      return null
    },
    deletePost: (id) => {
      const index = dbData.posts.findIndex(p => p.id === id)
      if (index !== -1) {
        dbData.posts.splice(index, 1)
        return true
      }
      return false
    },
    getAllPosts: () => dbData.posts
  }
}
