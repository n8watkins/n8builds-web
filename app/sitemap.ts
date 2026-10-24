import { MetadataRoute } from 'next'
import { builds } from '@/data/builds'
import { getBuildLog } from '@/lib/build-log'
import { getAllPosts } from '@/lib/sanity'
import { SITE_URL } from '@/lib/seo'

// Refreshed hourly, like /blog, so new posts appear without a deploy. A Sanity
// error throws on purpose: during a revalidation Next keeps serving the last
// good sitemap instead of one with every post missing.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, log] = await Promise.all([getAllPosts(), getBuildLog()])
  const latestPostEdit = posts.map((p) => p._updatedAt).sort().at(-1)
  const latestLogEntry = log.entries.map((e) => e.date).sort().at(-1)

  // Pages without a real modification date leave lastModified out rather
  // than claiming the build time, which teaches crawlers to ignore it.
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/loadout`, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestPostEdit ? new Date(latestPostEdit) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/builds`,
      lastModified: latestLogEntry ? new Date(latestLogEntry) : undefined,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...builds.map((build) => ({
      url: `${SITE_URL}/builds/${build.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug.current}`,
      lastModified: new Date(post._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
