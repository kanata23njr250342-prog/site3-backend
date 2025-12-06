/**
 * ローカルストレージユーティリティ
 * @module storage
 */

const STORAGE_KEYS = {
  DELETED_EXAMPLE_NOTES: 'deletedExampleNoteIds'
}

/**
 * ローカルストレージから削除済みメモIDを読み込む
 * @returns {Set} 削除済みメモID
 */
export const loadDeletedExampleNoteIds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DELETED_EXAMPLE_NOTES)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch (error) {
    console.error('Failed to load deleted note IDs from localStorage:', error)
    return new Set()
  }
}

/**
 * 削除済みメモIDをローカルストレージに保存
 * @param {Set} ids - 削除済みメモID
 * @returns {boolean} 保存成功の可否
 */
export const saveDeletedExampleNoteIds = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_EXAMPLE_NOTES, JSON.stringify(Array.from(ids)))
    return true
  } catch (error) {
    console.error('Failed to save deleted note IDs to localStorage:', error)
    return false
  }
}

/**
 * ローカルストレージをクリア
 * @returns {boolean} クリア成功の可否
 */
export const clearStorage = () => {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
    return false
  }
}
