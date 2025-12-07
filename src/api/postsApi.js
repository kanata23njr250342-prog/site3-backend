/**
 * 投稿作品API通信モジュール
 * @module postsApi
 */

import { getCurrentUserId } from '../utils/auth.js'

// 開発環境ではローカルサーバー、本番環境ではNetlify Functionsを使用
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api'
  : '/api'

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
    const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(category)}`)
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching posts:', error)
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
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      console.log('✅ File converted to Base64, size:', base64.length)
      resolve(base64)
    }
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error)
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

    console.log('📋 createPost - Extracted form data:', { title, category, fileName: file?.name })

    if (!title || !category || !file) {
      throw new Error('必須項目が不足しています')
    }

    // ファイルをBase64に変換
    console.log('🔄 Starting Base64 conversion...')
    const fileData = await fileToBase64(file)

    const payload = {
      title,
      category,
      fileData,
      fileName: file.name,
      authorId: getCurrentUserId()
    }
    console.log('📤 Sending POST request to:', `${API_BASE_URL}/posts`)
    console.log('📦 Payload size:', JSON.stringify(payload).length, 'bytes')

    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📥 Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ API error response:', errorData)
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }

    const result = await response.json()
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
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error updating post:', error)
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
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error deleting post:', error)
    throw new Error(getErrorMessage('投稿作品削除', error))
  }
}
