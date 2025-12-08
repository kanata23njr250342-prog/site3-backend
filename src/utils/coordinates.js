/**
 * 座標計算ユーティリティ
 * @module coordinates
 *
 * 座標系の定義：
 * - スクリーン座標: キャンバスコンテナ内の相対座標（左上が原点）
 * - キャンバス座標: 論理的な座標（メモの位置など、中央が原点）
 * - panX/panY: スクリーンピクセル単位のオフセット
 *
 * CSS変形: transform: scale(zoom) translate(panX, panY)
 * → まずzoomでスケール、その後panで移動（スクリーンピクセル単位）
 */

/**
 * スクリーン座標をキャンバス座標に変換
 *
 * CSS変形の逆順で戻す：
 * 1. translate(panX, panY) の逆 → - pan
 * 2. scale(zoom) の逆 → / zoom
 *
 * @param {number} screenX - スクリーンX座標（キャンバスコンテナ相対）
 * @param {number} screenY - スクリーンY座標（キャンバスコンテナ相対）
 * @param {number} screenCenterX - スクリーン中央X座標
 * @param {number} screenCenterY - スクリーン中央Y座標
 * @param {number} zoom - ズームレベル（デフォルト: 1）
 * @param {number} panX - パンX値（スクリーンピクセル単位）
 * @param {number} panY - パンY値（スクリーンピクセル単位）
 * @returns {Object} キャンバス座標 {x, y}
 */
export function screenToCanvas(screenX, screenY, screenCenterX, screenCenterY, zoom = 1, panX = 0, panY = 0) {
  // スクリーン座標を中央基準に変換
  const relativeX = screenX - screenCenterX
  const relativeY = screenY - screenCenterY

  // CSS変形の逆順で戻す：
  // 1. translate(panX, panY) の逆 → - pan
  // 2. scale(zoom) の逆 → / zoom
  const canvasX = (relativeX - panX) / zoom
  const canvasY = (relativeY - panY) / zoom

  return { x: canvasX, y: canvasY }
}

/**
 * キャンバス座標をスクリーン座標に変換（逆変換）
 *
 * CSS変形の順で適用：
 * 1. scale(zoom) → * zoom
 * 2. translate(panX, panY) → + pan
 *
 * @param {number} canvasX - キャンバスX座標
 * @param {number} canvasY - キャンバスY座標
 * @param {number} screenCenterX - スクリーン中央X座標
 * @param {number} screenCenterY - スクリーン中央Y座標
 * @param {number} zoom - ズームレベル（デフォルト: 1）
 * @param {number} panX - パンX値（スクリーンピクセル単位）
 * @param {number} panY - パンY値（スクリーンピクセル単位）
 * @returns {Object} スクリーン座標 {x, y}
 */
export function canvasToScreen(canvasX, canvasY, screenCenterX, screenCenterY, zoom = 1, panX = 0, panY = 0) {
  // CSS変形の順で適用：
  // 1. scale(zoom) → * zoom
  // 2. translate(panX, panY) → + pan
  const screenX = canvasX * zoom + panX + screenCenterX
  const screenY = canvasY * zoom + panY + screenCenterY

  return { x: screenX, y: screenY }
}

