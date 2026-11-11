import type { DigestPost } from '@/lib/newsletter/emails'

/**
 * The posts published in a window, straight from Sanity's query API: the
 * digest runs in the Worker's cron, outside Next, so it doesn't go through
 * lib/sanity.ts and its Next cache. Published documents only (no token).
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'abgyc32w'
const QUERY = `*[_type == "post" && defined(slug.current) && publishedAt > $since && publishedAt <= $until]
  | order(publishedAt asc){ title, "slug": slug.current, publishedAt, "excerpt": coalesce(excerpt, "") }`

export type PostSource = (since: string, until: string) => Promise<DigestPost[]>

export const sanityPosts: PostSource = async (since, until) => {
  const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v2024-07-01/data/query/production`)
  url.searchParams.set('query', QUERY)
  url.searchParams.set('$since', JSON.stringify(since))
  url.searchParams.set('$until', JSON.stringify(until))
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Sanity answered ${response.status}`)
  const { result } = (await response.json()) as { result: DigestPost[] }
  return result
}
