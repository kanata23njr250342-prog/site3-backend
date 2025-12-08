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
 * 動画ファイルを圧縮する（オンラインAPIを使用）
 * @param {File} file - 圧縮対象の動画ファイル
 * @returns {Promise<{compressed: Blob, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
export async function compressVideo(file) {
  console.log('🎬 Starting video compression:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type
  })

  // Cloudinary APIを使用して動画を圧縮
  // 注：本番環境ではCloudinary APIキーを環境変数から取得する必要があります
  const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/demo/video/upload'

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'demo') // デモプリセット（署名不要）
    formData.append('quality', 'auto:good') // 自動品質調整
    formData.append('fetch_format', 'auto') // 最適なフォーマットを自動選択
    formData.append('resource_type', 'video')

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.secure_url) {
      throw new Error('Cloudinary returned no URL')
    }

    // 圧縮されたファイルをダウンロード
    const compressedResponse = await fetch(data.secure_url)
    const compressedBlob = await compressedResponse.blob()

    const originalSize = file.size
    const compressedSize = compressedBlob.size
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log('✅ Video compressed successfully:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${ratio}%`,
      url: data.secure_url
    })

    return {
      compressed: compressedBlob,
      original: file,
      ratio: parseFloat(ratio),
      originalSize,
      compressedSize
    }
  } catch (error) {
    console.error('❌ Video compression failed:', error)
    throw error
  }
}

/**
 * ファイルが動画かどうかを判定
 * @param {File} file - チェック対象のファイル
 * @returns {boolean}
 */
export function isVideoFile(file) {
  return file.type.startsWith('video/')
}

/**
 * ファイルが画像かどうかを判定
 * @param {File} file - チェック対象のファイル
 * @returns {boolean}
 */
export function isImageFile(file) {
  return file.type.startsWith('image/')
}
