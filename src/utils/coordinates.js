/**
 * 座標計算ユーティリティ
 * @module coordinates
 */

/**
 * スクリーン座標をキャンバス座標（中央基準）に変換
 * @param {number} screenX - スクリーンX座標
 * @param {number} screenY - スクリーンY座標
 * @param {number} zoom - ズームレベル（デフォルト: 1）
 * @param {number} panX - パンX値（デフォルト: 0）
 * @param {number} panY - パンY値（デフォルト: 0）
 * @param {number} centerX - スクリーン中央X座標
 * @param {number} centerY - スクリーン中央Y座標
 * @returns {Object} キャンバス座標 {x, y}
 */
export function screenToCanvas(screenX, screenY, zoom = 1, panX = 0, panY = 0, centerX = 0, centerY = 0) {
  const canvasX = (screenX - panX - centerX) / zoom
  const canvasY = (screenY - panY - centerY) / zoom
  return { x: canvasX, y: canvasY }
}

