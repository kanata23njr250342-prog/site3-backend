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
    const { title } = body

    if (!title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const db = await getDb()
    const updated = await db.updatePost(id, { title })

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
