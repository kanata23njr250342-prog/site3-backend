import { getDb } from './db.js'

export default async (req, context) => {
  if (req.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const id = context.params.id
    const body = JSON.parse(req.body)
    const { title } = body

    if (!title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const db = getDb()
    const updated = db.updatePost(id, { title })

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating post:', error)
    return new Response(JSON.stringify({ error: 'Failed to update post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
