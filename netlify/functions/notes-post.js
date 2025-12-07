import { getDb } from './supabase-client.js'

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    let bodyText = req.body
    if (typeof bodyText !== 'string') {
      const buffer = await req.arrayBuffer()
      bodyText = new TextDecoder().decode(buffer)
    }
    const body = JSON.parse(bodyText)
    const { id, category, x, y, width, height, content, author, color, postId, authorId } = body

    if (!id || !category || content === undefined || !author || !color) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!authorId) {
      return new Response(JSON.stringify({ error: 'Author ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const db = await getDb()
    const now = new Date().toISOString()

    const note = {
      id,
      category,
      x,
      y,
      width,
      height,
      content,
      author,
      color,
      postId,
      authorId,
      createdAt: now,
      updatedAt: now,
      migrated: true
    }

    const savedNote = await db.addNote(note)

    return new Response(JSON.stringify(note), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return new Response(JSON.stringify({ error: 'Failed to create note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
