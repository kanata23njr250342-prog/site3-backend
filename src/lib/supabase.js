import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase initialization:')
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ set' : '❌ undefined')
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ set' : '❌ undefined')
console.log('  Environment:', import.meta.env.MODE)
console.log('  All env vars:', Object.keys(import.meta.env).filter(k => k.includes('SUPABASE')))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey)
  console.error('💡 Netlify環境変数を確認してください: https://app.netlify.com/sites/[site-name]/settings/build')
  throw new Error('Supabase環境変数が設定されていません。Netlifyの環境変数設定を確認してください。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase client initialized successfully')
