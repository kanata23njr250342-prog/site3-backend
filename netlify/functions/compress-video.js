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
      console.error('❌ Missing required fields')
      return new Response(JSON.stringify({ error: 'Missing fileData or fileName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('🎬 Starting video compression on backend:', {
      fileName,
      fileDataLength: fileData.length
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

    // CloudConvert APIで動画を圧縮
    // Base64をバイナリに変換
    const binaryString = Buffer.from(fileData, 'base64').toString('binary')
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // FormDataを作成
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', Buffer.from(bytes), fileName)
    formData.append('output_format', 'mp4')
    formData.append('video_codec', 'h264')
    formData.append('crf', '28') // 品質（低いほど高品質）
    formData.append('preset', 'fast') // エンコード速度

    console.log('📤 Sending to CloudConvert API...')

    const response = await fetch('https://api.cloudconvert.com/v2/convert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      body: formData,
      timeout: 300000 // 5分のタイムアウト
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ CloudConvert API error:', response.status, errorText)
      throw new Error(`CloudConvert API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'completed' && data.output && data.output[0]) {
      const downloadUrl = data.output[0].url
      
      console.log('📥 Downloading compressed video...')
      
      // 圧縮されたファイルをダウンロード
      const downloadResponse = await fetch(downloadUrl, {
        timeout: 60000
      })

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`)
      }

      const compressedBuffer = await downloadResponse.buffer()
      const compressedBase64 = compressedBuffer.toString('base64')
      
      const originalSize = Buffer.byteLength(fileData, 'base64')
      const compressedSize = compressedBuffer.length
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
    } else {
      console.error('❌ CloudConvert job not completed:', data)
      throw new Error('CloudConvert compression not completed')
    }
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
