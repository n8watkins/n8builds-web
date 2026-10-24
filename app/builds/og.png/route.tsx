import { shareCard } from '@/lib/og-card'

// The build log's share card: /builds/og.png. Static: it names the page, not
// its latest entries, so it never goes stale.

export const dynamic = 'force-static'

export async function GET() {
  return shareCard({
    seed: 'build-log',
    // The cyan accent of the site, as on "building in public" posts.
    topic: 'building-in-public',
    eyebrow: 'Shipping, from GitHub',
    title: 'The build log',
    subtitle: 'What shipped across every n8builds project, month by month, straight from GitHub.',
    footer: 'n8builds.dev/builds',
  })
}
