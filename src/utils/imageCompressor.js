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
 * 動画ファイルを圧縮する（バックエンド経由でCloudConvert APIを使用）
 * @param {File} file - 圧縮対象の動画ファイル
 * @returns {Promise<{compressed: Blob, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
export async function compressVideo(file) {
  console.log('🎬 Starting video compression:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type
  })

  try {
    // ファイルをBase64に変換
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)
    let fileBase64 = ''
    for (let i = 0; i < uint8Array.length; i++) {
      fileBase64 += String.fromCharCode(uint8Array[i])
    }
    fileBase64 = btoa(fileBase64)

    console.log('📤 Sending to backend for compression...')

    // バックエンドのcompress-videoエンドポイントを呼び出し
    const response = await fetch('/.netlify/functions/compress-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileData: fileBase64,
        fileName: file.name
      })
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      console.warn('⚠️ Video compression not available:', data.message)
      throw new Error(`Compression failed: ${data.message}`)
    }

    // 圧縮率が0%の場合はエラー扱い（圧縮が実際に行われていない）
    if (data.ratio === 0) {
      console.warn('⚠️ Compression ratio is 0%, treating as failure')
      throw new Error('Compression did not reduce file size')
    }

    // 圧縮されたBase64をBlobに変換
    const compressedBuffer = Buffer.from(data.compressedData, 'base64')
    const compressedBlob = new Blob([compressedBuffer], { type: 'video/mp4' })

    console.log('✅ Video compressed successfully:', {
      originalSize: `${(data.originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(data.compressedSize / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${data.ratio}%`
    })

    return {
      compressed: compressedBlob,
      original: file,
      ratio: data.ratio,
      originalSize: data.originalSize,
      compressedSize: data.compressedSize
    }
  } catch (error) {
    console.error('❌ Video compression failed:', error)
    // 圧縮失敗時は元ファイルを返す
    return {
      compressed: file,
      original: file,
      ratio: 0,
      originalSize: file.size,
      compressedSize: file.size
    }
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
