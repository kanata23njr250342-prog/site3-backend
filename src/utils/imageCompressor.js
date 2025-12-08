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
 * 動画をWebM形式に変換する
 * FFmpeg.wasmを使用してブラウザ側で変換
 * @param {File} file - 変換対象の動画ファイル
 * @returns {Promise<File>}
 */
export async function convertToWebM(file) {
  try {
    console.log('🎬 Starting WebM conversion:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    })

    // FFmpeg.wasmをロード
    const { FFmpeg, fetchFile } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.mjs')
    
    const ffmpeg = new FFmpeg()
    
    // FFmpegの初期化
    if (!ffmpeg.isLoaded()) {
      console.log('📥 Loading FFmpeg...')
      await ffmpeg.load({
        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js'
      })
    }

    // ファイルをFFmpegのファイルシステムに書き込み
    console.log('📝 Writing file to FFmpeg filesystem...')
    const inputFileName = file.name
    const outputFileName = file.name.replace(/\.[^.]+$/, '.webm')
    
    await ffmpeg.writeFile(inputFileName, await fetchFile(file))

    // WebM形式に変換
    console.log('🔄 Converting to WebM...')
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libvpx-vp9',
      '-crf', '30',
      '-b:v', '0',
      '-c:a', 'libopus',
      outputFileName
    ])

    // 変換されたファイルを読み込み
    console.log('📤 Reading converted file...')
    const data = await ffmpeg.readFile(outputFileName)
    const webmBlob = new Blob([data.buffer], { type: 'video/webm' })

    // ファイルシステムをクリーンアップ
    await ffmpeg.deleteFile(inputFileName)
    await ffmpeg.deleteFile(outputFileName)

    const webmFile = new File([webmBlob], outputFileName, {
      type: 'video/webm'
    })

    console.log('✅ Video converted to WebM:', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      webmSize: `${(webmBlob.size / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${((1 - webmBlob.size / file.size) * 100).toFixed(1)}%`
    })

    return webmFile
  } catch (error) {
    console.error('❌ WebM conversion failed:', error)
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

