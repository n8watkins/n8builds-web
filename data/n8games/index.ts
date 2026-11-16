/**
 * n8games on this site: its address, its build page and its ad, in one place.
 *
 * The games site lives at partygames.n8builds.dev today and will move to
 * games.n8builds.dev: change N8GAMES_URL and every link here follows (the
 * ad, the /games card and the build page).
 */

/** The games site. */
export const N8GAMES_URL = 'https://partygames.n8builds.dev'

/** The open-source repository: the party kit, the room and the site. */
export const N8GAMES_REPO = 'https://github.com/n8watkins/n8-party-games'

/**
 * The build page. A stable address: the games site links back to it
 * ("Learn more"), so keep it.
 */
export const N8GAMES_PAGE = '/builds/n8games'

/**
 * The ad for n8games (owner, 2026-11-16): a wide picture of the rendered party
 * room, one line, "Play" to the games site and "Learn more" to the build page.
 * It runs on the homepage (before the portfolio ad) and at the top of /games.
 * `show: false` takes it off both; swap the words or the pictures here.
 */
export const N8GAMES_AD = {
  show: true,
  eyebrow: 'n8games',
  heading: "Come play what I've been building",
  body: "Party games I've been playing around with: friends join from their phones with a code, walk a little piece around the room and pick the next game by standing in its light. Two are playable now, more are on the way.",
  play: { label: 'Play', href: N8GAMES_URL },
  more: { label: 'Learn more', href: N8GAMES_PAGE },
  /** The owner's render (from n8watkins/n8-party-games, landing/public/img/hero-2000.webp). */
  image: {
    /** The whole room, 2:1, from 640px. */
    wide: { src: '/games/n8games/room-wide.webp', width: 2000, height: 1000 },
    /** Cropped close on the pieces, 16:10, for phones (and the /games card). */
    close: { src: '/games/n8games/room-action.webp', width: 960, height: 600 },
    alt: 'A rendered party room: a red pawn punches a robot with a boxing glove on a spring, a yellow slime zooms past and a white ghost looks on, under lamps and game posters, with the join code by the door.',
  },
} as const
