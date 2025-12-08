/**
 * 動画圧縮エンドポイント
 * バックエンド側で動画を圧縮し、圧縮されたBase64データを返す
 * CloudConvert APIを使用（環境変数 CLOUDCONVERT_API_KEY が必要）
 */
export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    let bodyText = req.body
    
    // req.bodyがストリームの場合は読み込む
    if (typeof bodyText !== 'string') {
      const buffer = await req.arrayBuffer()
      bodyText = new TextDecoder().decode(buffer)
    }
    
    const body = JSON.parse(bodyText)
    const { fileData, fileName } = body

    if (!fileData || !fileName) {
      console.error('❌ Missing required fields:', { fileData: !!fileData, fileName: !!fileName })
      return new Response(JSON.stringify({ 
        error: 'Missing fileData or fileName',
        received: { fileData: !!fileData, fileName: !!fileName }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('🎬 Starting video compression on backend:', {
      fileName,
      fileDataLength: fileData.length,
      fileDataType: typeof fileData
    })

    // CloudConvert APIを使用して動画を圧縮
    // 注：CLOUDCONVERT_API_KEYを環境変数に設定する必要があります
    const apiKey = process.env.CLOUDCONVERT_API_KEY
    
    if (!apiKey) {
      console.warn('⚠️ CLOUDCONVERT_API_KEY not set, returning original file')
      return new Response(JSON.stringify({
        success: false,
        message: 'Video compression not available',
        compressedData: fileData,
        ratio: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('🔑 API Key is set, proceeding with compression')

    // CloudConvert Job APIを使用
    // Step 1: ジョブを作成
    console.log('📝 Creating CloudConvert job...')
    
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'import-my-file': {
            operation: 'import/base64',
            file: fileData,
            filename: fileName
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
      })
    })

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text()
      console.error('❌ CloudConvert job creation error:', jobResponse.status, errorText)
      throw new Error(`CloudConvert job creation failed: ${jobResponse.status}`)
    }

    const jobData = await jobResponse.json()
    const jobId = jobData.data.id

    console.log('✅ Job created:', jobId)

    // Step 2: ジョブの完了を待つ（ポーリング）
    let jobStatus = 'processing'
    let maxAttempts = 60 // 最大60回（約5分）
    let attempts = 0

    while (jobStatus === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5秒待機

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      jobStatus = statusData.data.status

      console.log(`⏳ Job status: ${jobStatus} (attempt ${attempts + 1}/${maxAttempts})`)

      attempts++
    }

    if (jobStatus !== 'finished') {
      throw new Error(`Job did not complete: ${jobStatus}`)
    }

    console.log('✅ Job completed')

    // Step 3: 出力ファイルをダウンロード
    const finalJobResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

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
    
    const originalSize = Buffer.byteLength(fileData, 'base64')
    const compressedSize = Buffer.byteLength(compressedBase64, 'base64')
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log('✅ Video compressed successfully:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${ratio}%`
    })

    return new Response(JSON.stringify({
      success: true,
      compressedData: compressedBase64,
      ratio: parseFloat(ratio),
      originalSize,
      compressedSize
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Video compression error:', error.message)
    console.error('Stack:', error.stack)
    
    // エラー時は失敗を返す
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
      error: 'Video compression failed, please try again'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
