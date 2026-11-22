/**
 * The shape of one n8games game's page (/builds/n8games/<slug>) and of its
 * card on the n8games page. One file per game in data/n8games/games/.
 * Every fact on a page comes from the game's own repository or design notes,
 * named in its file's header.
 */

/** The icons a "How it's made" item can carry (components/builds/n8games/icons.tsx). */
export type MadeIcon =
  | 'camera'
  | 'sun'
  | 'cog'
  | 'server'
  | 'sound'
  | 'plug'
  | 'mic'
  | 'offline'
  | 'book'
  | 'face'
  | 'gauge'
  | 'shield'
  | 'phone'
  | 'image'
  | 'test'
  | 'palette'
  | 'eye'
  | 'users'
  | 'layers'
  | 'mask'
  | 'cards'

/** Each game's own touch on top of the shared n8games look (data/n8games/themes.ts). */
export type GameTheme = 'cork' | 'potato' | 'who' | 'derby' | 'masks'

export interface GameLink {
  label: string
  href: string
  /** A YouTube link carries YouTube's mark. */
  youtube?: boolean
}

export interface GamePicture {
  src: string
  width: number
  height: number
  alt: string
  caption: string
}

export interface N8Game {
  slug: string
  name: string
  theme: GameTheme
  /** Its card on the n8games page's shelf. */
  card: {
    line: string
    /** Who plays, and on what. */
    meta: string
    /** Its poster (3:4). */
    tile: string
    tileAlt: string
    /** The poster's lean on the shelf, in degrees. */
    tilt: number
  }
  /** Two short lines on what it is, under its name. */
  intro: [string, string]
  /**
   * Where it is played. `live` drives what the card and the page say: true,
   * "Playable" and Go play to `href`; false, the game is not on the live site
   * yet, so they say "Coming soon" and the main button is "See the games site"
   * (`href` is then the games site's front door).
   */
  play: {
    href: string
    live: boolean
    /** A second place to play it, said as a smaller link beside Go play (Who Am I?'s own site). */
    also?: { label: string; href: string }
  }
  /** The public repository (or folder of one), for "Get the code". Left out where there is none. */
  code?: string
  /** A real capture of the game being played: silent, looping. */
  clip: {
    webm: string
    mp4: string
    poster: string
    width: number
    height: number
    alt: string
    /** How it is framed: a landscape screen, or upright phones. */
    frame: 'screen' | 'phone'
    /** Where it was recorded, said under it. */
    caption: string
    /** A smaller encode of the same clip (640 wide) that phones get instead, for the heaviest clips. */
    phone?: { webm: string; mp4: string }
  }
  /** Two to four more pictures. */
  pictures: GamePicture[]
  /** "How a round goes": three to five steps. */
  steps: string[]
  /** "How it's made": short items, an icon and one or two sentences each. */
  made: { icon: MadeIcon; title: string; body: string }[]
  /** Where the facts in "How it's made" come from; no link where the source is private. */
  madeFrom: { label: string; href?: string }
  credits: {
    heading: string
    body: string[]
    links: GameLink[]
    fine: string[]
  }[]
  /** The share card's picture, 1200x630 JPEG (the card's words sit on its left). */
  share: string
}
