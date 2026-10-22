import { builds, getBuild } from '@/data/builds'
import { shareCard } from '@/lib/og-card'

// A build's share card: /builds/<slug>/og.png. Rendered at build time, since
// the builds list is static.

export const dynamicParams = false

export function generateStaticParams() {
  return builds.map((b) => ({ slug: b.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const build = getBuild(slug)
  if (!build) return new Response('Not found', { status: 404 })

  return shareCard({
    seed: build.slug,
    eyebrow: build.category,
    title: build.name,
    subtitle: build.tagline,
    footer: `n8builds.dev/builds/${build.slug}`,
  })
}
