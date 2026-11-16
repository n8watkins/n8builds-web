import { gamePage } from '@/data/n8games'
import { N8GAMES_GAMES, getGame } from '@/data/n8games/games'
import { shareCard } from '@/lib/og-card'
import { readPublicFile } from '@/lib/publicFile'

// An n8games game's share card: /builds/n8games/<game>/og.png, its name over a
// picture of the game itself. Rendered at build time, since the games are static.

export const dynamicParams = false

export function generateStaticParams() {
  return N8GAMES_GAMES.map((g) => ({ slug: 'n8games', game: g.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; game: string }> }) {
  const { slug, game: name } = await params
  const game = slug === 'n8games' ? getGame(name) : undefined
  if (!game) return new Response('Not found', { status: 404 })

  const picture = await readPublicFile(game.share)
  return shareCard({
    background: `data:image/jpeg;base64,${Buffer.from(picture).toString('base64')}`,
    seed: game.slug,
    eyebrow: 'n8games',
    title: game.name,
    subtitle: game.card.line,
    footer: `n8builds.dev${gamePage(game.slug)}`,
  })
}
