import { MetadataRoute } from 'next'
import { builds } from '@/data/builds'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://n8builds.dev'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...builds.map(build => ({
      url: `${baseUrl}/builds/${build.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}