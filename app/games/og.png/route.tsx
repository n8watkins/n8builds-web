import { shareCard } from '@/lib/og-card'

// The games page's share card: /games/og.png. Static: it names the page, not
// the games, so it never goes stale.

export const dynamic = 'force-static'

export async function GET() {
  return shareCard({
    seed: 'games',
    eyebrow: 'Games',
    title: 'Take a break, play something',
    subtitle: 'Small games I built, all free: a two-phone guessing game, a portfolio face-off, a dino to catch and a command-line trainer.',
    footer: 'n8builds.dev/games',
  })
}
