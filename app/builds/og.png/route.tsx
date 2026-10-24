import { shareCard } from '@/lib/og-card'

// The build log's share card: /builds/og.png. Static: it names the page, not
// its latest entries, so it never goes stale.

export const dynamic = 'force-static'

export async function GET() {
  return shareCard({
    seed: 'build-log',
    eyebrow: 'Build log',
    title: 'What shipped, month by month',
    subtitle: 'Releases and changes across every n8builds project, straight from GitHub.',
    footer: 'n8builds.dev/builds',
  })
}
