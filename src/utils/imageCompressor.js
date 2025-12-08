import Compressor from 'compressorjs'

/**
 * ファイルを圧縮する（画像または動画）
 * @param {File} file - 圧縮対象のファイル
 * @param {Object} options - 圧縮オプション
 * @returns {Promise<{compressed: File, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
export async function compressImage(file, options = {}) {
  // ファイルタイプを判定
  if (file.type.startsWith('video/')) {
    return compressVideo(file, options)
  } else {
    return compressImageFile(file, options)
  }
}

/**
 * 画像ファイルを圧縮する
 * @param {File} file - 圧縮対象のファイル
 * @param {Object} options - 圧縮オプション
 * @returns {Promise<{compressed: File, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
async function compressImageFile(file, options = {}) {
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
 * 動画ファイルを圧縮する（シンプル版：ビットレート削減）
 * @param {File} file - 圧縮対象の動画ファイル
 * @param {Object} options - 圧縮オプション
 * @returns {Promise<{compressed: File, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
async function compressVideo(file, options = {}) {
  const { quality = 0.8 } = options
  
  console.log('🎬 Starting video compression:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type
  })

  try {
    // FFmpeg.wasmをスクリプトタグで動的に読み込む
    const FFmpeg = window.FFmpeg?.FFmpeg
    const fetchFile = window.FFmpeg?.fetchFile

    if (!FFmpeg || !fetchFile) {
      console.log('⏳ Loading FFmpeg libraries...')
      
      // FFmpeg coreスクリプトを読み込む
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })

      // FFmpegメインスクリプトを読み込む
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const ffmpeg = new window.FFmpeg.FFmpeg()
    
    // FFmpegの初期化
    if (!ffmpeg.isLoaded()) {
      console.log('⏳ Initializing FFmpeg...')
      await ffmpeg.load({
        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js'
      })
    }

    // ファイルをFFmpegに読み込む
    const inputName = file.name
    const outputName = `compressed_${Date.now()}.mp4`
    
    console.log('📥 Reading video file...')
    const data = await file.arrayBuffer()
    ffmpeg.writeFile(inputName, new Uint8Array(data))

    // ビットレートを計算（品質に基づいて）
    // quality 0.8 = 1000kbps, 0.5 = 500kbps, 1.0 = 1500kbps
    const bitrate = Math.round(1000 * quality) + 'k'
    
    console.log(`🔄 Compressing with bitrate: ${bitrate}...`)
    // 動画を圧縮（H.264コーデック、指定ビットレート）
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-b:v', bitrate,
      '-c:a', 'aac',
      '-b:a', '96k',
      outputName
    ])

    // 圧縮されたファイルを読み込む
    console.log('📤 Reading compressed video...')
    const compressedData = ffmpeg.readFile(outputName)
    const compressedBlob = new Blob([compressedData.buffer], { type: 'video/mp4' })
    const compressedFile = new File([compressedBlob], outputName, { type: 'video/mp4' })

    // クリーンアップ
    ffmpeg.deleteFile(inputName)
    ffmpeg.deleteFile(outputName)

    const originalSize = file.size
    const compressedSize = compressedFile.size
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log('✅ Video compressed successfully:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${ratio}%`
    })

    return {
      compressed: compressedFile,
      original: file,
      ratio: parseFloat(ratio),
      originalSize,
      compressedSize
    }
  } catch (error) {
    console.error('❌ Video compression failed:', error)
    throw new Error(`動画の圧縮に失敗しました: ${error.message}`)
  }
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
