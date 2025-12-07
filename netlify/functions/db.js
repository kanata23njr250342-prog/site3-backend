/**
 * Netlify Functions用のデータベース管理
 * メモリ上でデータを保持
 * 注: Netlify Functionsは各リクエストで新しいプロセスが起動されるため、
 * 本番環境ではNetlify Blobs、Supabase、DynamoDBなどの外部DBサービスの使用を推奨
 */

// グローバルメモリにデータを保持（同一プロセス内での共有用）
let dbData = {
  notes: [],
  posts: [],
  version: '2.0'
}

// 初期データをロード（開発環境用）
function initializeDb() {
  // 既にデータがある場合はスキップ
  if (dbData.posts.length > 0 || dbData.notes.length > 0) {
    return
  }
  
  // 初期データ（必要に応じて追加）
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
