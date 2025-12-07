import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('SUPABASE_URL:', supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '***' : 'undefined')
}

// サーバーサイドではサービスロールキーを使用（管理者権限）
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('✅ Supabase server client initialized')
