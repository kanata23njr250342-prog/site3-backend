import FormData from 'form-data'
import { Readable } from 'stream'

/**
 * 動画圧縮エンドポイント
 * バックエンド側で動画を圧縮し、圧縮されたBase64データを返す
 * CloudConvert APIを使用（環境変数 CLOUDCONVERT_API_KEY が必要）
 */
export default async (req, context) => {
  console.log('🔵 compress-video function called')
  console.log('📋 Request method:', req.method)
  
  if (req.method !== 'POST') {
    console.error('❌ Invalid method:', req.method)
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    console.log('📖 Reading request body...')
    let bodyText = req.body
    
    // req.bodyがストリームの場合は読み込む
    if (typeof bodyText !== 'string') {
      console.log('📦 Body is not a string, converting from buffer...')
      const buffer = await req.arrayBuffer()
      bodyText = new TextDecoder().decode(buffer)
      console.log('✅ Buffer converted to string, length:', bodyText.length)
    }
    
    console.log('🔍 Parsing JSON body...')
    const body = JSON.parse(bodyText)
    const { fileData, fileName } = body

    console.log('📊 Extracted data:', {
      fileData: fileData ? `${fileData.length} chars` : 'missing',
      fileName: fileName || 'missing'
    })

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
    
    console.log('🔑 Checking API Key...')
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

    console.log('✅ API Key is set, proceeding with compression')

    // CloudConvert APIを使用（form-dataで動画ファイルを送信）
    // Step 1: Base64をバイナリに変換
    console.log('🔄 Converting Base64 to binary...')
    const binaryString = Buffer.from(fileData, 'base64').toString('binary')
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const buffer = Buffer.from(bytes)
    console.log('✅ Binary conversion complete, size:', buffer.length)

    // Step 2: FormDataを作成
    console.log('📝 Creating FormData...')
    const form = new FormData()
    
    // ファイルをストリームとして追加
    const stream = Readable.from(buffer)
    form.append('file', stream, {
      filename: fileName,
      contentType: 'video/mp4'
    })
    form.append('output_format', 'mp4')
    form.append('video_codec', 'h264')
    form.append('crf', '28')
    form.append('preset', 'fast')
    
    console.log('✅ FormData created')

    // Step 3: CloudConvert APIに送信
    console.log('📤 Sending to CloudConvert API...')
    console.log('🔗 URL: https://api.cloudconvert.com/v2/convert')
    console.log('🔑 Authorization: Bearer [API_KEY]')
    
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/convert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form,
      timeout: 300000 // 5分
    })

    console.log('📥 Response status:', jobResponse.status)

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text()
      console.error('❌ CloudConvert API error:', jobResponse.status)
      console.error('📝 Error details:', errorText)
      throw new Error(`CloudConvert API error: ${jobResponse.status} - ${errorText}`)
    }

    const jobData = await jobResponse.json()
    console.log('✅ CloudConvert response received')
    console.log('📊 Response data:', JSON.stringify(jobData, null, 2))
    
    const jobId = jobData.data?.id
    if (!jobId) {
      console.error('❌ No job ID in response')
      throw new Error('No job ID returned from CloudConvert')
    }

    console.log('✅ Job created:', jobId)

    // Step 2: ジョブの完了を待つ（ポーリング）
    console.log('⏳ Waiting for job completion...')
    let jobStatus = 'processing'
    let maxAttempts = 60 // 最大60回（約5分）
    let attempts = 0

    while (jobStatus === 'processing' && attempts < maxAttempts) {
      console.log(`⏳ Polling... (attempt ${attempts + 1}/${maxAttempts})`)
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5秒待機

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!statusResponse.ok) {
        console.error('❌ Failed to check job status:', statusResponse.status)
        throw new Error(`Failed to check job status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      jobStatus = statusData.data.status

      console.log(`📊 Job status: ${jobStatus} (attempt ${attempts + 1}/${maxAttempts})`)

      attempts++
    }

    if (jobStatus !== 'finished') {
      console.error('❌ Job did not complete:', jobStatus)
      throw new Error(`Job did not complete: ${jobStatus}`)
    }

    console.log('✅ Job completed successfully')

    // Step 3: 出力ファイルをダウンロード
    console.log('📥 Fetching final job data...')
    const finalJobResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!finalJobResponse.ok) {
      console.error('❌ Failed to fetch final job data:', finalJobResponse.status)
      throw new Error(`Failed to fetch final job data: ${finalJobResponse.status}`)
    }

    const finalJobData = await finalJobResponse.json()
    console.log('📊 Final job data:', JSON.stringify(finalJobData, null, 2))
    
    const exportTask = finalJobData.data.tasks.find(t => t.name === 'export-my-file')

    if (!exportTask || !exportTask.result || !exportTask.result.files || exportTask.result.files.length === 0) {
      console.error('❌ No output file found in job result')
      throw new Error('No output file found in job result')
    }

    const downloadUrl = exportTask.result.files[0].url

    console.log('📥 Downloading compressed video from:', downloadUrl)

    const downloadResponse = await fetch(downloadUrl)

    if (!downloadResponse.ok) {
      console.error('❌ Download failed:', downloadResponse.status)
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
    console.error('📋 Error type:', error.constructor.name)
    console.error('📋 Stack:', error.stack)
    
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
