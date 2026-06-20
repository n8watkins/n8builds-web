import { NextResponse } from 'next/server'
import { getRecentPosts } from '@/lib/sanity'

// Feeds the homepage "N8 Notions" strip. Server-side so @sanity/client stays out
// of the homepage client bundle. Cached/revalidated hourly.
export const revalidate = 3600

export async function GET() {
  try {
    const posts = await getRecentPosts(3)
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Failed to load recent notions:', error)
    return NextResponse.json({ posts: [] })
  }
}
