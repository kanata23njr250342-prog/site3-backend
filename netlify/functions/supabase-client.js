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
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  })
  console.log('✅ Supabase client created successfully')
  
  // テスト接続
  console.log('🔗 Testing Supabase connection...')
  const { data: testData, error: testError } = await supabase
    .from('posts')
    .select('id')
    .limit(1)
  
  if (testError) {
    console.warn('⚠️ Connection test error (may be normal):', testError.message)
  } else {
    console.log('✅ Connection test successful')
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message)
  console.error('Error details:', error)
  throw error
}

export async function getDb() {
  return {
    // メモ関連
    getNotes: async (category) => {
      try {
        console.log('📖 Fetching notes for category:', category)
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('category', category)
        
        if (error) {
          console.error('❌ Error fetching notes:', error.message)
          console.error('Error details:', error)
          return []
        }
        console.log('✅ Fetched', data?.length || 0, 'notes')
        return data || []
      } catch (e) {
        console.error('❌ Exception in getNotes:', e.message)
        return []
      }
    },

    addNote: async (note) => {
      try {
        console.log('📝 Adding note:', note.id)
        const { data, error } = await supabase
          .from('notes')
          .insert([note])
          .select()
        
        if (error) {
          console.error('❌ Error adding note:', error.message)
          console.error('Error details:', error)
          throw error
        }
        console.log('✅ Note added:', data?.[0]?.id)
        return data?.[0] || note
      } catch (e) {
        console.error('❌ Exception in addNote:', e.message)
        throw e
      }
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
      try {
        console.log('📖 Fetching posts for category:', category)
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('category', category)
        
        if (error) {
          console.error('❌ Error fetching posts:', error.message)
          console.error('Error details:', error)
          return []
        }
        console.log('✅ Fetched', data?.length || 0, 'posts')
        return data || []
      } catch (e) {
        console.error('❌ Exception in getPosts:', e.message)
        return []
      }
    },

    addPost: async (post) => {
      try {
        console.log('📝 Adding post:', post.id, 'with columns:', Object.keys(post))
        const { data, error } = await supabase
          .from('posts')
          .insert([post])
          .select()
        
        if (error) {
          console.error('❌ Error adding post:', error.message)
          console.error('Error code:', error.code)
          console.error('Error details:', error)
          throw new Error(`Failed to insert post: ${error.message}`)
        }
        console.log('✅ Post added:', data?.[0]?.id)
        return data?.[0] || post
      } catch (e) {
        console.error('❌ Exception in addPost:', e.message)
        throw e
      }
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
