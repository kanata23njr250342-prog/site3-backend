/**
 * メモAPI通信モジュール
 * @module notesApi
 */

import { getCurrentUserId } from '../utils/auth.js'

// 開発環境ではローカルサーバー、本番環境ではNetlify Functionsを直接呼び出し
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api'
  : '/.netlify/functions'

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
 * 指定カテゴリーのメモを取得する
 * @async
 * @param {string} category - カテゴリー名
 * @returns {Promise<Array>} メモの配列
 * @throws {Error} API通信エラー
 */
export async function fetchNotes(category) {
  if (!category) {
    throw new Error('カテゴリーが指定されていません')
  }

  try {
    const endpoint = import.meta.env.DEV
      ? `${API_BASE_URL}/notes/${encodeURIComponent(category)}`
      : `${API_BASE_URL}/notes-get?category=${encodeURIComponent(category)}`
    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching notes:', error)
    throw new Error(getErrorMessage('メモ取得', error))
  }
}

/**
 * 新しいメモを作成する
 * @async
 * @param {Object} noteData - メモデータ
 * @returns {Promise<Object>} 作成されたメモ
 * @throws {Error} API通信エラー
 */
export async function createNote(noteData) {
  if (!noteData || typeof noteData !== 'object') {
    throw new Error('メモデータが無効です')
  }

  try {
    // ユーザーIDを追加
    const dataWithUserId = {
      ...noteData,
      authorId: getCurrentUserId()
    }

    const endpoint = import.meta.env.DEV
      ? `${API_BASE_URL}/notes`
      : `${API_BASE_URL}/notes-post`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataWithUserId)
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error creating note:', error)
    throw new Error(getErrorMessage('メモ作成', error))
  }
}

/**
 * メモを更新する
 * @async
 * @param {string} noteId - メモID
 * @param {Object} updates - 更新内容
 * @returns {Promise<Object>} 更新されたメモ
 * @throws {Error} API通信エラー
 */
export async function updateNote(noteId, updates) {
  if (!noteId) {
    throw new Error('メモIDが指定されていません')
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('更新内容が無効です')
  }

  try {
    const endpoint = import.meta.env.DEV
      ? `${API_BASE_URL}/notes/${noteId}`
      : `${API_BASE_URL}/notes-put?id=${noteId}`
    const response = await fetch(endpoint, {
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
    console.error('Error updating note:', error)
    throw new Error(getErrorMessage('メモ更新', error))
  }
}

/**
 * メモを削除する
 * @async
 * @param {string} noteId - メモID
 * @returns {Promise<Object>} 削除結果
 * @throws {Error} API通信エラー
 */
export async function deleteNote(noteId) {
  if (!noteId) {
    throw new Error('メモIDが指定されていません')
  }

  try {
    const endpoint = import.meta.env.DEV
      ? `${API_BASE_URL}/notes/${noteId}`
      : `${API_BASE_URL}/notes-delete?id=${noteId}`
    const response = await fetch(endpoint, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error deleting note:', error)
    throw new Error(getErrorMessage('メモ削除', error))
  }
}
