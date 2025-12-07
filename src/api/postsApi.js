/**
 * 投稿作品API通信モジュール（Supabase対応）
 * @module postsApi
 */

import { supabase } from '../lib/supabase.js'
import { getCurrentUserId } from '../utils/auth.js'

/**
 * APIエラーメッセージを生成
 * @param {string} operation - 操作名
 * @param {Error} error - エラーオブジェクト
 * @returns {string} エラーメッセージ
 */
const getErrorMessage = (operation, error) => {
  if (error.message.includes('Failed to fetch')) {
    return `${operation}に失敗しました。サーバーが起動しているか確認してください。`
  }
  return `${operation}に失敗しました: ${error.message}`
}

/**
 * 指定カテゴリーの投稿作品を取得する
 * @async
 * @param {string} category - カテゴリー名
 * @returns {Promise<Array>} 投稿作品の配列
 * @throws {Error} API通信エラー
 */
export async function fetchPosts(category) {
  if (!category) {
    throw new Error('カテゴリーが指定されていません')
  }

  try {
    console.log('📥 Fetching posts from Supabase:', { category })
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', category)
      .order('createdAt', { ascending: false })
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }
    
    console.log('✅ Posts fetched:', data?.length || 0)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('❌ Error fetching posts:', error)
    throw new Error(getErrorMessage('投稿作品取得', error))
  }
}

/**
 * ファイルをBase64に変換
 * @param {File} file - ファイルオブジェクト
 * @returns {Promise<string>} Base64文字列
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    console.log('📂 Converting file to Base64:', { name: file.name, size: file.size })
    
    try {
      const reader = new FileReader()
      
      const timeout = setTimeout(() => {
        reader.abort()
        reject(new Error('FileReader timeout'))
      }, 30000) // 30秒のタイムアウト
      
      reader.onload = () => {
        clearTimeout(timeout)
        try {
          const result = reader.result
          if (!result) {
            throw new Error('FileReader result is empty')
          }
          const base64 = result.split(',')[1]
          if (!base64) {
            throw new Error('Failed to extract base64 from result')
          }
          console.log('✅ File converted to Base64, size:', base64.length)
          resolve(base64)
        } catch (error) {
          console.error('❌ Error processing FileReader result:', error)
          reject(error)
        }
      }
      
      reader.onerror = (error) => {
        clearTimeout(timeout)
        console.error('❌ FileReader error:', error)
        reject(error)
      }
      
      reader.onabort = () => {
        clearTimeout(timeout)
        console.error('❌ FileReader aborted')
        reject(new Error('FileReader was aborted'))
      }
      
      console.log('🔄 Starting FileReader.readAsDataURL...')
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('❌ Error in fileToBase64:', error)
      reject(error)
    }
  })
}

/**
 * 新しい投稿作品を作成する
 * @async
 * @param {FormData} formData - フォームデータ（title, file, category）
 * @returns {Promise<Object>} 作成された投稿作品
 * @throws {Error} API通信エラー
 */
export async function createPost(formData) {
  if (!formData) {
    throw new Error('フォームデータが無効です')
  }

  try {
    const title = formData.get('title')
    const category = formData.get('category')
    const file = formData.get('file')
    const authorId = getCurrentUserId()

    console.log('📋 createPost - Extracted form data:', { title, category, fileName: file?.name })

    if (!title || !category || !file) {
      throw new Error('必須項目が不足しています')
    }

    // ファイルをBase64に変換
    console.log('🔄 Starting Base64 conversion...')
    const fileData = await fileToBase64(file)
    
    // MIME typeを判定
    const getMimeType = (fileName) => {
      const ext = fileName.toLowerCase().split('.').pop()
      const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime'
      }
      return mimeTypes[ext] || 'application/octet-stream'
    }
    
    const mimeType = getMimeType(file.name)
    const src = `data:${mimeType};base64,${fileData}`

    console.log('📤 Creating post in Supabase...')
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        title,
        category,
        src,
        fileName: file.name,
        authorId
      }])
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    const result = data[0]
    console.log('✅ Post created successfully:', result)
    return result
  } catch (error) {
    console.error('❌ Error creating post:', error)
    throw new Error(getErrorMessage('投稿作品作成', error))
  }
}

/**
 * 投稿作品を更新する
 * @async
 * @param {string} postId - 投稿作品ID
 * @param {Object} updates - 更新内容
 * @returns {Promise<Object>} 更新された投稿作品
 * @throws {Error} API通信エラー
 */
export async function updatePost(postId, updates) {
  if (!postId) {
    throw new Error('投稿作品IDが指定されていません')
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('更新内容が無効です')
  }

  try {
    console.log('📝 Updating post in Supabase:', { postId, updates })
    
    const { data, error } = await supabase
      .from('posts')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', postId)
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Post updated successfully:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Error updating post:', error)
    throw new Error(getErrorMessage('投稿作品更新', error))
  }
}

/**
 * 投稿作品を削除する
 * @async
 * @param {string} postId - 投稿作品ID
 * @returns {Promise<Object>} 削除結果
 * @throws {Error} API通信エラー
 */
export async function deletePost(postId) {
  if (!postId) {
    throw new Error('投稿作品IDが指定されていません')
  }

  try {
    console.log('🗑️ Deleting post from Supabase:', { postId })
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Post deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting post:', error)
    throw new Error(getErrorMessage('投稿作品削除', error))
  }
}
