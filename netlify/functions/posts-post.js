import { getDb } from './supabase-client.js'

/**
 * Base64文字列をBuffer に変換
 */
function base64ToBuffer(base64String) {
  const binaryString = Buffer.from(base64String, 'base64').toString('binary')
  return Buffer.from(binaryString, 'binary')
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    
    let title, category, authorId, fileData, fileName

    console.log('📥 Received content-type:', contentType)

    if (contentType.includes('application/json')) {
      // JSON形式（Base64エンコードされたファイル）
      let bodyText = req.body
      
      // req.bodyがストリームの場合は読み込む
      if (typeof bodyText !== 'string') {
        const buffer = await req.arrayBuffer()
        bodyText = new TextDecoder().decode(buffer)
      }
      
      console.log('📥 Received body length:', bodyText.length)
      
      const body = JSON.parse(bodyText)
      title = body.title
      category = body.category
      authorId = body.authorId
      fileData = body.fileData // Base64形式
      fileName = body.fileName
      
      console.log('✅ Parsed JSON request:', { title, category, fileName, authorId, fileDataLength: fileData?.length })
    } else if (contentType.includes('multipart/form-data')) {
      // FormData形式（バイナリファイル）
      console.log('📥 Processing FormData...')
      const buffer = await req.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      fileData = Buffer.from(uint8Array).toString('base64')
      
      // FormDataのパースは複雑なため、ここでは簡略化
      // 実際にはmultipart-parserライブラリを使用することを推奨
      console.error('❌ FormData parsing not implemented')
      return new Response(JSON.stringify({ error: 'Please send file as Base64 in JSON format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      console.error('❌ Invalid content-type:', contentType)
      return new Response(JSON.stringify({ error: 'Invalid content-type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!title || !category || !fileData || !fileName) {
      console.error('❌ Missing required fields:', { title, category, fileData: !!fileData, fileName })
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!authorId) {
      console.error('❌ Author ID is required')
      return new Response(JSON.stringify({ error: 'Author ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const postId = Date.now().toString()

    // ファイル拡張子からMIMEタイプを判定
    const getMimeType = (fileName) => {
      const ext = fileName.toLowerCase().split('.').pop()
      const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime'
      }
      return mimeTypes[ext] || 'application/octet-stream'
    }

    const mimeType = getMimeType(fileName)
    const dataUrl = `data:${mimeType};base64,${fileData}`

    const post = {
      id: postId,
      title,
      category,
      src: dataUrl, // data:URLで保存
      fileName,
      authorId,
      createdAt: now,
      updatedAt: now,
      migrated: true
    }

    console.log('📝 Adding post to Supabase:', { id: postId, title, category })
    const savedPost = await db.addPost(post)
    console.log('✅ Post saved successfully:', savedPost.id)

    return new Response(JSON.stringify(savedPost), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Error creating post:', error.message)
    console.error('Stack:', error.stack)
    return new Response(JSON.stringify({ 
      error: 'Failed to create post',
      message: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
