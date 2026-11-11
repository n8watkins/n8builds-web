import HomePage from '@/components/HomePage'
import JsonLd from '@/components/JsonLd'
import { pageMetadata, siteJsonLd } from '@/lib/seo'
import { getRecentPosts, type Post } from '@/lib/sanity'

export const metadata = pageMetadata({
  title: 'n8builds | Public Builder Lab',
  description: 'Think big. Ship fast. Apps, AI tools, Chrome extensions, local utilities, and the build logs behind them.',
  shareDescription: 'Think big. Ship fast. Apps, tools, experiments, and build logs.',
  path: '/',
})

// The page is static and refreshed every six hours, like /blog. A new post
// reaches the "N8's Notions" strip at once: publishing in Sanity expires the
// page (app/api/sanity/revalidate) and empties the edge cache. Six hours, not
// one, because each refresh renders the whole page (about a second of CPU).
export const revalidate = 21600

/** The 4 newest posts (the newest featured, then 3); none (the strip hides) if Sanity is unreachable. */
async function recentPosts(): Promise<Post[]> {
  try {
    return await getRecentPosts(4)
  } catch (error) {
    console.error('Failed to load recent notions:', error)
    return []
  }
}

export default async function Home() {
  const posts = await recentPosts()
  return (
    <>
      <JsonLd data={siteJsonLd} />
      <HomePage posts={posts} />
    </>
  )
}
