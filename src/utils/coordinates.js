/**
 * 座標計算ユーティリティ
 * @module coordinates
 */

/**
 * スクリーン座標をキャンバス座標（中央基準）に変換
 * 
 * キャンバス座標系：
 * - 原点 (0, 0) はスクリーン中央
 * - X軸：右が正
 * - Y軸：下が正
 * 
 * 変換式：
 * canvasX = (screenX - screenCenterX - panX) / zoom
 * canvasY = (screenY - screenCenterY - panY) / zoom
 * 
 * @param {number} screenX - スクリーンX座標（左上基準）
 * @param {number} screenY - スクリーンY座標（左上基準）
 * @param {number} screenCenterX - スクリーン中央X座標
 * @param {number} screenCenterY - スクリーン中央Y座標
 * @param {number} zoom - ズームレベル（デフォルト: 1）
 * @param {number} panX - パンX値（キャンバス座標系）
 * @param {number} panY - パンY値（キャンバス座標系）
 * @returns {Object} キャンバス座標 {x, y}
 */
export function screenToCanvas(screenX, screenY, screenCenterX, screenCenterY, zoom = 1, panX = 0, panY = 0) {
  // スクリーン座標を中央基準に変換
  const relativeScreenX = screenX - screenCenterX
  const relativeScreenY = screenY - screenCenterY
  
  // ズームを適用
  const zoomedX = relativeScreenX / zoom
  const zoomedY = relativeScreenY / zoom
  
  // パンを適用
  const canvasX = zoomedX - panX
  const canvasY = zoomedY - panY
  
  return { x: canvasX, y: canvasY }
}

/**
 * キャンバス座標をスクリーン座標に変換（逆変換）
 * 
 * @param {number} canvasX - キャンバスX座標
 * @param {number} canvasY - キャンバスY座標
 * @param {number} screenCenterX - スクリーン中央X座標
 * @param {number} screenCenterY - スクリーン中央Y座標
 * @param {number} zoom - ズームレベル（デフォルト: 1）
 * @param {number} panX - パンX値（キャンバス座標系）
 * @param {number} panY - パンY値（キャンバス座標系）
 * @returns {Object} スクリーン座標 {x, y}
 */
export function canvasToScreen(canvasX, canvasY, screenCenterX, screenCenterY, zoom = 1, panX = 0, panY = 0) {
  // パンを適用（逆）
  const unPannedX = canvasX + panX
  const unPannedY = canvasY + panY
  
  // ズームを適用（逆）
  const unZoomedX = unPannedX * zoom
  const unZoomedY = unPannedY * zoom
  
  // 中央基準をスクリーン座標に変換
  const screenX = unZoomedX + screenCenterX
  const screenY = unZoomedY + screenCenterY
  
  return { x: screenX, y: screenY }
}

