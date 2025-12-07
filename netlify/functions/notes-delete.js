import { getDb } from './supabase-client.js'

export default async (req, context) => {
  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const db = await getDb()

    const deleted = await db.deleteNote(id)

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ message: 'Note deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error deleting note:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
