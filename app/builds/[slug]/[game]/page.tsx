import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import GamePage from '@/components/builds/n8games/GamePage'
import { gamePage } from '@/data/n8games'
import { N8GAMES_GAMES, getGame } from '@/data/n8games/games'
import { pageMetadata } from '@/lib/seo'

/**
 * One n8games game's own page: /builds/n8games/<game> (owner, 2026-11-16).
 * Only n8games has pages under it, so every other address here is a 404.
 */

interface GamePageProps {
  params: Promise<{ slug: string; game: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return N8GAMES_GAMES.map((g) => ({ slug: 'n8games', game: g.slug }))
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug, game: name } = await params
  const game = slug === 'n8games' ? getGame(name) : undefined
  if (!game) notFound()
  return pageMetadata({
    title: `${game.name} | n8games | n8builds`,
    description: `${game.intro[0]} ${game.intro[1]} How a round goes, and how it's made.`,
    shareDescription: game.intro[0],
    path: gamePage(game.slug),
    image: {
      url: `${gamePage(game.slug)}/og.png`,
      width: 1200,
      height: 630,
      alt: `${game.name}: ${game.card.line}`,
    },
  })
}

export default async function N8gamesGamePage({ params }: GamePageProps) {
  const { slug, game: name } = await params
  const game = slug === 'n8games' ? getGame(name) : undefined
  if (!game) notFound()
  return (
    <>
      <Navbar />
      <GamePage game={game} />
    </>
  )
}
