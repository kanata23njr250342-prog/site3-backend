import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

console.log('🔧 Supabase initialization:')
console.log('  SUPABASE_URL:', supabaseUrl ? `✓ ${supabaseUrl.substring(0, 30)}...` : '✗ Missing')
console.log('  SUPABASE_ANON_KEY:', supabaseAnonKey ? `✓ ${supabaseAnonKey.substring(0, 20)}...` : '✗ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  throw new Error('Supabase environment variables are not configured')
}

let supabase
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('✅ Supabase client created successfully')
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message)
  throw error
}

export async function getDb() {
  return {
    // メモ関連
    getNotes: async (category) => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('category', category)
      
      if (error) {
        console.error('❌ Error fetching notes:', error)
        return []
      }
      return data || []
    },

    addNote: async (note) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([note])
        .select()
      
      if (error) {
        console.error('❌ Error adding note:', error)
        throw error
      }
      return data?.[0] || note
    },

    updateNote: async (id, updates) => {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) {
        console.error('❌ Error updating note:', error)
        throw error
      }
      return data?.[0] || null
    },

    deleteNote: async (id) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Error deleting note:', error)
        throw error
      }
      return true
    },

    getAllNotes: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
      
      if (error) {
        console.error('❌ Error fetching all notes:', error)
        return []
      }
      return data || []
    },

    // 投稿作品関連
    getPosts: async (category) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', category)
      
      if (error) {
        console.error('❌ Error fetching posts:', error)
        return []
      }
      return data || []
    },

    addPost: async (post) => {
      const { data, error } = await supabase
        .from('posts')
        .insert([post])
        .select()
      
      if (error) {
        console.error('❌ Error adding post:', error)
        throw error
      }
      return data?.[0] || post
    },

    updatePost: async (id, updates) => {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) {
        console.error('❌ Error updating post:', error)
        throw error
      }
      return data?.[0] || null
    },

    deletePost: async (id) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Error deleting post:', error)
        throw error
      }
      return true
    },

    getAllPosts: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
      
      if (error) {
        console.error('❌ Error fetching all posts:', error)
        return []
      }
      return data || []
    }
  }
}

export { supabase }
