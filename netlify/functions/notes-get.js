import { getDb } from './db.js'

export default async (req, context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    
    if (!category) {
      return new Response(JSON.stringify({ error: 'Category is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const db = getDb()
    const notes = db.getNotes(category).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    return new Response(JSON.stringify(notes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch notes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
