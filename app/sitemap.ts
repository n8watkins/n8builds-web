import { MetadataRoute } from 'next'
import { builds } from '@/data/builds'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://n8builds.dev'

  const shelfRoutes = ['lab', 'extensions', 'tools', 'loadout']

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...shelfRoutes.map(route => ({
      url: `${baseUrl}/${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...builds.map(build => ({
      url: `${baseUrl}/builds/${build.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}