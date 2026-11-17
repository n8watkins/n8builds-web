import { builds, getBuild } from '@/data/builds'
import { N8GAMES_SHARE } from '@/data/n8games'
import { shareCard } from '@/lib/og-card'
import { readPublicFile } from '@/lib/publicFile'

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

  // n8games has a card of its own: the room, on the right (data/n8games/index.ts).
  if (build.slug === 'n8games') {
    const picture = await readPublicFile(N8GAMES_SHARE)
    return shareCard({
      background: `data:image/jpeg;base64,${Buffer.from(picture).toString('base64')}`,
      seed: build.slug,
      eyebrow: 'n8games',
      title: build.name,
      subtitle: 'Party games for friends in one room, each on their own phone.',
      footer: `n8builds.dev/builds/${build.slug}`,
      layout: 'split',
    })
  }

  return shareCard({
    seed: build.slug,
    eyebrow: build.category,
    title: build.name,
    subtitle: build.tagline,
    footer: `n8builds.dev/builds/${build.slug}`,
  })
}
