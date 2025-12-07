/**
 * メモAPI通信モジュール（Supabase対応）
 * @module notesApi
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
    console.log('📥 Fetching notes from Supabase:', { category })
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('category', category)
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }
    
    // フロントエンド側でソート（createdAtの降順）
    const sortedData = Array.isArray(data) ? data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ) : []
    
    console.log('✅ Notes fetched:', sortedData?.length || 0)
    return sortedData
  } catch (error) {
    console.error('❌ Error fetching notes:', error)
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
    console.log('📝 Creating note in Supabase:', noteData)
    
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        ...noteData,
        authorid: getCurrentUserId()
      }])
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Note created successfully:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Error creating note:', error)
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
    console.log('📝 Updating note in Supabase:', { noteId, updates })
    
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Note updated successfully:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Error updating note:', error)
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
    console.log('🗑️ Deleting note from Supabase:', { noteId })
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Note deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting note:', error)
    throw new Error(getErrorMessage('メモ削除', error))
  }
}
