import { getDb } from './db.js'

export default async (req, context) => {
  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const db = getDb()

    const deleted = db.deletePost(id)

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ message: 'Post deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
