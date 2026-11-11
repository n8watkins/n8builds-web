import { getFeedPosts } from '@/lib/sanity'
import { buildFeed } from '@/lib/rss'

// The N8's Notions feed. Revalidated like /blog, so a new post shows up in
// readers without a deploy. A Sanity error throws on purpose: during a
// revalidation Next keeps serving the last good feed instead of an empty one.
export const revalidate = 21600

export async function GET() {
  const posts = await getFeedPosts()
  return new Response(buildFeed(posts), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
