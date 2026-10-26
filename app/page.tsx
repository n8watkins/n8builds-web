import HomePage from '@/components/HomePage'
import JsonLd from '@/components/JsonLd'
import { pageMetadata, siteJsonLd } from '@/lib/seo'
import { getRecentPosts, type Post } from '@/lib/sanity'

export const metadata = pageMetadata({
  title: 'n8builds | Public Builder Lab',
  description: 'Spending tokens, shipping features. Apps, AI tools, Chrome extensions, local utilities, and the build logs behind them.',
  shareDescription: 'Spending tokens, shipping features. Apps, tools, experiments, and build logs.',
  path: '/',
})

// The page is static and refreshed hourly, like /blog, so a new post reaches
// the "N8's Notions" strip within the hour.
export const revalidate = 3600

/** The 3 newest posts; none (the strip hides) if Sanity is unreachable. */
async function recentPosts(): Promise<Post[]> {
  try {
    return await getRecentPosts(3)
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
