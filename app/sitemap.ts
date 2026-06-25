import { MetadataRoute } from 'next'
import { builds } from '@/data/builds'
import { getAllPosts } from '@/lib/sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://n8builds.dev'

  // Shelves now live as sections on the homepage (no standalone pages); only
  // /loadout remains its own route.
  const shelfRoutes = ['loadout']

  // N8 Notions posts (read from Sanity). Tolerate Sanity being unreachable at
  // build time — still emit the rest of the sitemap.
  let postEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await getAllPosts()
    postEntries = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug.current}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // Sanity unreachable — skip post URLs this build.
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...shelfRoutes.map((route) => ({
      url: `${baseUrl}/${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...builds.map((build) => ({
      url: `${baseUrl}/builds/${build.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...postEntries,
  ]
}
