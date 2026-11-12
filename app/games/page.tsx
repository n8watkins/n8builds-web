import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight, FiGithub, FiPlay } from 'react-icons/fi'
import { LuTerminal } from 'react-icons/lu'
import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import { DINO_COLS, DINO_FRAMES, DINO_ROWS, framePaths } from '@/components/features/dino/sprite'
import { GAMES, type Game } from '@/data/games'
import { pageMetadata } from '@/lib/seo'

// Static, like /upcoming: the games are a list in data/games.ts, so the page is
// prerendered once per deploy and the edge cache keeps it (#189, #193). Don't
// read cookies or headers here: that would make it render on every visit.

export const metadata = pageMetadata({
  title: 'Games | n8builds',
  description:
    'Small games I built, all free: Who Am I?, a two-player guessing game for two phones; PortfolioRank Play, a portfolio face-off; the homepage dino catch; and Terminal Invaders, a command-line trainer.',
  shareDescription: 'Small games I built, all free: a two-phone guessing game, a portfolio face-off, a dino to catch and a command-line trainer.',
  path: '/games',
  image: {
    url: '/games/og.png',
    width: 1200,
    height: 630,
    alt: 'Games by n8builds: small games, all free',
  },
})

const DINO = framePaths(DINO_FRAMES.stepA)

/** A game's mark: its own icon, or a drawn one for the games without a file. */
function GameMark({ game }: { game: Game }) {
  const tile = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10'
  if (game.icon === 'dino') {
    return (
      <span className={`${tile} bg-[#0b1a2c]`}>
        <svg viewBox={`0 0 ${DINO_COLS} ${DINO_ROWS}`} className="h-6 w-6" aria-hidden shapeRendering="crispEdges">
          <path d={DINO.body} fill="var(--accent)" />
          <path d={DINO.eye} fill="#050812" />
          <path d={DINO.shine} fill="#fff" />
        </svg>
      </span>
    )
  }
  if (game.icon === 'terminal') {
    return (
      <span className={`${tile} bg-[#140d22] text-(--accent)`}>
        <LuTerminal aria-hidden className="h-5 w-5" />
      </span>
    )
  }
  return <Image src={game.icon} alt="" width={40} height={40} className={`${tile} object-cover`} />
}

/** "Play": the game's own site in a new tab, or the homepage anchor in this one. */
function PlayButton({ game }: { game: Game }) {
  const external = game.href.startsWith('http')
  const className =
    'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-(--accent) px-5 text-sm font-bold whitespace-nowrap text-slate-950 transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)'
  const label = game.cta ?? 'Play'
  // The visible words start the accessible name (WCAG 2.5.3), then which game.
  if (!external) {
    return (
      <Link href={game.href} aria-label={`${label}: ${game.name}`} className={className}>
        <FiPlay aria-hidden className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    )
  }
  return (
    <a href={game.href} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${game.name} (opens in a new tab)`} className={className}>
      <FiPlay aria-hidden className="h-4 w-4 shrink-0" />
      {label}
      <FiArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />
    </a>
  )
}

function GameCard({ game, index }: { game: Game; index: number }) {
  return (
    <FadeIn as="article" delay={0.05 + index * 0.06} id={game.slug} aria-labelledby={`${game.slug}-name`} className="flex scroll-mt-24">
      <div
        style={{ '--accent': game.accent } as CSSProperties}
        className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/80 transition-colors hover:border-(--accent)/40"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-[3px] bg-(--accent)" />
        {/* The game itself, as a picture: the button below opens the real one. */}
        <div className="relative aspect-16/10 overflow-hidden border-b border-white/8 bg-[#07101d]">
          <Image
            src={game.shot}
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"
            priority={index < 2}
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <header className="flex items-center gap-3">
            <GameMark game={game} />
            <h2 id={`${game.slug}-name`} className="min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight text-slate-50">
              {game.name}
            </h2>
            <span className="shrink-0 rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
              {game.kind}
            </span>
          </header>
          <p className="mt-3 text-[0.95rem] leading-snug text-pretty text-slate-300">{game.description}</p>
          {game.note && <p className="mt-2 text-sm leading-snug text-pretty text-[#8193ad]">{game.note}</p>}
          <ul aria-label="At a glance" className="mt-4 flex flex-wrap gap-1.5">
            {game.tags.map((tag) => (
              <li key={tag} className="rounded-md bg-white/6 px-2 py-0.5 font-mono text-[0.7rem] font-semibold tracking-wide text-slate-300">
                {tag}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5">
            <PlayButton game={game} />
            {game.repo && (
              <a
                href={`https://github.com/${game.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-200"
              >
                <FiGithub aria-hidden className="h-4 w-4 shrink-0" />
                View the code
                <span className="sr-only"> of {game.name} on GitHub (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-128 w-lg scale-[1.6] bg-radial from-violet-500/6 to-transparent to-70%" />
          <div className="absolute right-[-10%] top-[40rem] h-120 w-120 scale-[1.6] bg-radial from-cyan-500/6 to-transparent to-70%" />
        </div>

        <div className="relative mx-auto max-w-site px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          <FadeIn as="header">
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">Games</p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none">
              Take a break,{' '}
              <span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">play something</span>
            </h1>
            <p className="mt-4 max-w-[640px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7">
              Small games I&rsquo;ve built, all free. Most run in your browser with no account; each one opens on its own site.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 md:mt-12 lg:gap-6">
            {GAMES.map((game, index) => (
              <GameCard key={game.slug} game={game} index={index} />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
