/**
 * ユーザー認証ユーティリティ
 * @module auth
 */

const STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_NAME: 'userName'
}

/**
 * ユーザーIDを生成
 * @returns {string} ユーザーID
 */
const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 現在のユーザーIDを取得
 * @returns {string} ユーザーID
 */
export const getCurrentUserId = () => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID)
  
  if (!userId) {
    userId = generateUserId()
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
  }
  
  return userId
}

/**
 * 現在のユーザー名を取得
 * @returns {string} ユーザー名
 */
export const getCurrentUserName = () => {
  return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '匿名'
}

/**
 * ユーザー名を設定
 * @param {string} name - ユーザー名
 * @returns {boolean} 設定成功の可否
 */
export const setCurrentUserName = (name) => {
  if (!name || typeof name !== 'string') {
    console.error('Invalid user name')
    return false
  }

  try {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name.trim())
    return true
  } catch (error) {
    console.error('Failed to set user name:', error)
    return false
  }
}

/**
 * ユーザー情報をリセット
 * @returns {boolean} リセット成功の可否
 */
export const resetUserInfo = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_ID)
    localStorage.removeItem(STORAGE_KEYS.USER_NAME)
    return true
  } catch (error) {
    console.error('Failed to reset user info:', error)
    return false
  }
}

/**
 * 指定されたユーザーIDが現在のユーザーのものかどうか確認
 * @param {string} userId - 確認するユーザーID
 * @returns {boolean} 現在のユーザーのものかどうか
 */
export const isCurrentUser = (userId) => {
  return userId === getCurrentUserId()
}
