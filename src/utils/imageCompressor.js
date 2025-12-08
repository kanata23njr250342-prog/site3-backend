import Compressor from 'compressorjs'

/**
 * 画像ファイルを圧縮する
 * @param {File} file - 圧縮対象のファイル
 * @param {Object} options - 圧縮オプション
 * @returns {Promise<{compressed: File, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    console.log('🖼️ Starting image compression:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    })

    new Compressor(file, {
      maxWidth,
      maxHeight,
      quality,
      mimeType,
      success(result) {
        const originalSize = file.size
        const compressedSize = result.size
        const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

        console.log('✅ Image compressed successfully:', {
          originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
          ratio: `${ratio}%`
        })

        resolve({
          compressed: result,
          original: file,
          ratio: parseFloat(ratio),
          originalSize,
          compressedSize
        })
      },
      error(err) {
        console.error('❌ Image compression failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * ファイルサイズが制限を超えているかチェック
 * @param {File} file - チェック対象のファイル
 * @param {number} maxSizeMB - 最大サイズ（MB）
 * @returns {boolean}
 */
export function isFileTooLarge(file, maxSizeMB = 10) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size > maxSizeBytes
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param {number} bytes - バイト数
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 圧縮が必要かどうかを判定
 * @param {File} file - チェック対象のファイル
 * @param {number} thresholdMB - 圧縮推奨閾値（MB）
 * @returns {boolean}
 */
export function shouldCompress(file, thresholdMB = 5) {
  const thresholdBytes = thresholdMB * 1024 * 1024
  return file.size > thresholdBytes
}

/**
 * 画像をWebP形式に変換する
 * @param {File|Blob} file - 変換対象のファイル
 * @param {number} quality - 品質（0-1）
 * @returns {Promise<File>}
 */
export async function convertToWebP(file, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        
        // WebPに変換
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert to WebP'))
              return
            }
            
            const originalName = file.name.replace(/\.[^.]+$/, '')
            const webpFile = new File([blob], `${originalName}.webp`, {
              type: 'image/webp'
            })
            
            console.log('✅ Image converted to WebP:', {
              originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
              webpSize: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
              reduction: `${((1 - blob.size / file.size) * 100).toFixed(1)}%`
            })
            
            resolve(webpFile)
          },
          'image/webp',
          quality
        )
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 動画をWebM形式に変換する（将来的な実装用）
 * 注：ブラウザ側での動画変換は複雑なため、バックエンド側での実装が推奨される
 * @param {File} file - 変換対象の動画ファイル
 * @returns {Promise<File>}
 */
export async function convertToWebM(file) {
  // 現在はブラウザ側での動画変換は未実装
  // バックエンド側でFFmpeg等を使用して実装することを推奨
  console.warn('⚠️ WebM conversion not implemented on client side')
  throw new Error('WebM conversion requires backend implementation')
}

