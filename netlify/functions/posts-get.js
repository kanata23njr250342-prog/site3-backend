import { getDb } from './supabase-client.js'

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

    const db = await getDb()
    const posts = await db.getPosts(category)
    
    // 新しい順でソート
    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    console.log('✅ Fetched', sortedPosts.length, 'posts for category:', category)
    
    return new Response(JSON.stringify(sortedPosts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Error fetching posts:', error.message)
    return new Response(JSON.stringify({ error: 'Failed to fetch posts', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
