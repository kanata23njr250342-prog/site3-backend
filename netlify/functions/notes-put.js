import { getDb } from './db.js'

export default async (req, context) => {
  if (req.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const id = context.params.id
    const body = JSON.parse(req.body)
    const { content, author, width, height, x, y } = body

    const db = getDb()
    const updates = {}

    if (content !== undefined) updates.content = content
    if (author !== undefined) updates.author = author
    if (width !== undefined) updates.width = width
    if (height !== undefined) updates.height = height
    if (x !== undefined) updates.x = x
    if (y !== undefined) updates.y = y

    const updated = db.updateNote(id, updates)

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
