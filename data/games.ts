/**
 * The games on /games (owner, 2026-11-11: "one place listing the playable
 * games, each card linking to its own site"). Only what is playable today:
 * PortfolioRank's "guess the percentile" waits behind its GAMES_V2 flag, so
 * its card describes the face-off and says more is coming.
 *
 * Each card's picture is a screenshot of the game itself (public/games/,
 * 960x600 WebP, taken with GET requests only). Copy comes from each game's
 * own site and README; keep it in step and modest.
 */

export type Game = {
  slug: string
  name: string
  /** One line: what you do in it. */
  description: string
  /** A short note under the line, e.g. that more modes are coming. */
  note?: string
  /** What kind of game it is, as the pill beside the name. */
  kind: string
  tags: string[]
  /** Where "Play" goes: the game's own site, or a homepage anchor. */
  href: string
  /** The button's words, when not "Play". */
  cta?: string
  /** The game's mark: an image path, or 'dino' / 'terminal' for a drawn one. */
  icon: string
  shot: string
  /** The public repository, for the "View the code" link. */
  repo?: string
  /** Its colour, lightened for this dark site. */
  accent: string
}

export const GAMES: Game[] = [
  {
    slug: 'who-am-i',
    name: 'Who Am I?',
    description:
      'A party guessing game for two phones: you each get a secret identity, and only your opponent can see yours.',
    note: 'No account: start a room and share it by link, QR code or PIN.',
    kind: 'Party game',
    tags: ['2 players', 'Phone', 'No account', 'Free'],
    href: 'https://whoami.n8builds.dev',
    icon: '/upcoming/whoami.svg',
    shot: '/games/whoami.webp',
    repo: 'n8watkins/who-am-i',
    accent: '#9d8cff',
  },
  {
    slug: 'portfoliorank-play',
    name: 'PortfolioRank Play',
    description:
      'Two real developer portfolios side by side: pick the one you would rather hire from, and see how the crowd voted.',
    note: 'More game modes coming.',
    kind: 'Face-off',
    tags: ['1 player', 'Browser', 'No account to start', 'Free'],
    href: 'https://portfoliorank.n8builds.dev/play',
    icon: '/builds/portfolio-rank/icon.png',
    shot: '/games/portfoliorank-play.webp',
    repo: 'n8watkins/portfolio-rank',
    accent: '#fbbf24',
  },
  {
    slug: 'dino',
    name: 'Dino catch',
    description:
      'The pixel dino hopping along my AI kit on the homepage: click it to start a 30-second catch round and chase your best score.',
    note: 'Hidden on the homepage, with its own chiptune.',
    kind: 'Easter egg',
    tags: ['1 player', 'Desktop or phone', '30 seconds', 'Free'],
    href: '/#ai-kit',
    cta: 'Find the dino',
    icon: 'dino',
    shot: '/games/dino.webp',
    repo: 'n8watkins/n8builds-web',
    accent: '#22d3ee',
  },
  {
    slug: 'terminal-invaders',
    name: 'Terminal Invaders',
    description:
      'An arcade-style command-line trainer: finish missions by typing real commands, with a score, combos and learning paths.',
    note: 'Not online: it runs on your machine, in the terminal or the browser.',
    kind: 'Trainer',
    tags: ['1 player', 'Desktop', 'Runs locally', 'Free'],
    href: 'https://github.com/n8watkins/terminal-invaders#quick-start',
    cta: 'Play locally',
    icon: 'terminal',
    shot: '/games/terminal-invaders.webp',
    accent: '#c084fc',
  },
]
