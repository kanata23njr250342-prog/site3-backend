import { getDb } from './supabase-client.js'

export default async (req, context) => {
  if (req.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    let bodyText = req.body
    if (typeof bodyText !== 'string') {
      const buffer = await req.arrayBuffer()
      bodyText = new TextDecoder().decode(buffer)
    }
    const body = JSON.parse(bodyText)
    const { content, author, width, height, x, y } = body

    const db = await getDb()
    const updates = {}

    if (content !== undefined) updates.content = content
    if (author !== undefined) updates.author = author
    if (width !== undefined) updates.width = width
    if (height !== undefined) updates.height = height
    if (x !== undefined) updates.x = x
    if (y !== undefined) updates.y = y

    const updated = await db.updateNote(id, updates)

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating note:', error)
    return new Response(JSON.stringify({ error: 'Failed to update note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
