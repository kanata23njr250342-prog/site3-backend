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
 * 動画ファイルを圧縮する
 * 1. バックエンド側で圧縮を試みる
 * 2. バックエンド失敗時はCloudConvert APIを直接呼び出す
 * @param {File} file - 圧縮対象の動画ファイル
 * @returns {Promise<{compressed: Blob, original: File, ratio: number, originalSize: number, compressedSize: number}>}
 */
export async function compressVideo(file) {
  console.log('🎬 Starting video compression:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type
  })

  // ファイルをBase64に変換
  const fileBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(fileBuffer)
  let fileBase64 = ''
  for (let i = 0; i < uint8Array.length; i++) {
    fileBase64 += String.fromCharCode(uint8Array[i])
  }
  fileBase64 = btoa(fileBase64)

  // Step 1: バックエンド側での圧縮を試みる
  console.log('📤 Step 1: Trying backend compression...')
  try {
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

    if (response.ok) {
      const data = await response.json()

      if (data.success && data.ratio > 0) {
        console.log('✅ Backend compression succeeded')
        
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
      }
    }
  } catch (error) {
    console.warn('⚠️ Backend compression failed:', error.message)
  }

  // Step 2: バックエンド失敗時はCloudConvert APIを直接呼び出す
  console.log('📤 Step 2: Falling back to CloudConvert API...')
  
  const cloudConvertApiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY
  
  console.log('🔑 CloudConvert API key check:', cloudConvertApiKey ? '✅ found' : '❌ not found')
  if (cloudConvertApiKey) {
    console.log('🔑 API key length:', cloudConvertApiKey.length)
    console.log('🔑 API key first 20 chars:', cloudConvertApiKey.substring(0, 20) + '...')
  }
  
  if (!cloudConvertApiKey) {
    console.error('❌ CloudConvert API key not found in environment')
    console.error('📋 Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
    throw new Error('Video compression not available (no API key)')
  }

  try {
    // CloudConvert Job APIを使用
    console.log('📝 Creating CloudConvert job...')
    console.log('📋 Request details:')
    console.log('  - URL: https://api.cloudconvert.com/v2/jobs')
    console.log('  - Method: POST')
    console.log('  - Authorization: Bearer [API_KEY]')
    console.log('  - Content-Type: application/json')
    console.log('  - File name:', file.name)
    console.log('  - File size (Base64):', fileBase64.length, 'chars')
    
    const jobPayload = {
      tasks: {
        'import-my-file': {
          operation: 'import/base64',
          file: fileBase64,
          filename: file.name
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: 'mp4',
          video_codec: 'h264',
          crf: 28,
          preset: 'fast'
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    }
    
    console.log('📦 Payload structure:', JSON.stringify({
      tasks: Object.keys(jobPayload.tasks).map(k => ({
        name: k,
        operation: jobPayload.tasks[k].operation
      }))
    }))
    
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobPayload)
    })

    console.log('📥 Response status:', jobResponse.status)
    console.log('📥 Response headers:', {
      'content-type': jobResponse.headers.get('content-type'),
      'x-ratelimit-remaining': jobResponse.headers.get('x-ratelimit-remaining')
    })

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text()
      console.error('❌ CloudConvert API error response:', errorText)
      throw new Error(`CloudConvert job creation failed: ${jobResponse.status} - ${errorText}`)
    }

    const jobData = await jobResponse.json()
    const jobId = jobData.data.id

    console.log('✅ Job created:', jobId)

    // ジョブの完了を待つ（ポーリング）
    console.log('⏳ Waiting for job completion...')
    let jobStatus = 'processing'
    let maxAttempts = 60
    let attempts = 0

    while (jobStatus === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000))

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      jobStatus = statusData.data.status

      console.log(`📊 Job status: ${jobStatus} (attempt ${attempts + 1}/${maxAttempts})`)

      attempts++
    }

    if (jobStatus !== 'finished') {
      throw new Error(`Job did not complete: ${jobStatus}`)
    }

    console.log('✅ Job completed')

    // 出力ファイルをダウンロード
    console.log('📥 Fetching final job data...')
    const finalJobResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`
      }
    })

    if (!finalJobResponse.ok) {
      throw new Error(`Failed to fetch final job data: ${finalJobResponse.status}`)
    }

    const finalJobData = await finalJobResponse.json()
    const exportTask = finalJobData.data.tasks.find(t => t.name === 'export-my-file')

    if (!exportTask || !exportTask.result || !exportTask.result.files || exportTask.result.files.length === 0) {
      throw new Error('No output file found in job result')
    }

    const downloadUrl = exportTask.result.files[0].url

    console.log('📥 Downloading compressed video...')

    const downloadResponse = await fetch(downloadUrl)

    if (!downloadResponse.ok) {
      throw new Error(`Download failed: ${downloadResponse.status}`)
    }

    const compressedBuffer = await downloadResponse.arrayBuffer()
    const compressedBase64 = Buffer.from(compressedBuffer).toString('base64')
    
    const originalSize = Buffer.byteLength(fileBase64, 'base64')
    const compressedSize = Buffer.byteLength(compressedBase64, 'base64')
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log('✅ Video compressed successfully via CloudConvert:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${ratio}%`
    })

    const compressedBlob = new Blob([Buffer.from(compressedBase64, 'base64')], { type: 'video/mp4' })

    return {
      compressed: compressedBlob,
      original: file,
      ratio: parseFloat(ratio),
      originalSize,
      compressedSize
    }
  } catch (error) {
    console.error('❌ CloudConvert compression failed:', error)
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
