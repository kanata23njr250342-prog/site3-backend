import { createClient } from '@supabase/supabase-js'

console.log('🔧 Module loading: supabase-client.js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

console.log('🔧 Environment variables check:')
console.log('  SUPABASE_URL:', supabaseUrl ? `✓ Length: ${supabaseUrl.length}` : '✗ Missing')
console.log('  SUPABASE_ANON_KEY:', supabaseAnonKey ? `✓ Length: ${supabaseAnonKey.length}` : '✗ Missing')
console.log('  All env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error('Supabase environment variables are not configured')
  console.error('❌', error.message)
  console.error('Available env vars:', Object.keys(process.env).join(', '))
  throw error
}

let supabase
try {
  console.log('📝 Creating Supabase client with URL:', supabaseUrl)
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('✅ Supabase client created successfully')
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message)
  console.error('Error details:', error)
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
