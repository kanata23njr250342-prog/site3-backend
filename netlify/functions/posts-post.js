import { getDb } from './db.js'

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

    if (contentType.includes('application/json')) {
      // JSON形式（Base64エンコードされたファイル）
      let bodyText = req.body
      
      // req.bodyがストリームの場合は読み込む
      if (typeof bodyText !== 'string') {
        const buffer = await req.arrayBuffer()
        bodyText = new TextDecoder().decode(buffer)
      }
      
      console.log('📥 Received body:', bodyText.substring(0, 200))
      
      const body = JSON.parse(bodyText)
      title = body.title
      category = body.category
      authorId = body.authorId
      fileData = body.fileData // Base64形式
      fileName = body.fileName
      
      console.log('✅ Parsed request:', { title, category, fileName, authorId, fileDataLength: fileData?.length })
    } else {
      // FormData形式は Netlify Functions では直接サポートされていないため、
      // フロントエンド側でBase64に変換して送信する必要があります
      console.error('❌ Invalid content-type:', contentType)
      return new Response(JSON.stringify({ error: 'Please send file as Base64 in JSON format' }), {
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

    const db = getDb()
    const now = new Date().toISOString()
    const postId = Date.now().toString()

    const post = {
      id: postId,
      title,
      category,
      src: fileData, // Base64形式で保存
      fileName,
      authorId,
      createdAt: now,
      updatedAt: now
    }

    db.addPost(post)

    return new Response(JSON.stringify({
      ...post,
      src: `data:image/png;base64,${fileData.substring(0, 100)}...` // プレビュー用
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating post:', error)
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
