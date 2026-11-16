import type { N8Game } from '../types'
import { corkAndBell } from './cork-and-bell'
import { hotPotato } from './hot-potato'
import { paperMasks } from './paper-masks'
import { tinDerby } from './tin-derby'
import { whoAmI } from './who-am-i'

/**
 * The five games, in shelf order. Each is one file here, and each has its own
 * page at /builds/n8games/<slug> (in the sitemap, with its own share card).
 * Adding a game: a file here, its pictures in public/games/n8games/<slug>/,
 * and its look in data/n8games/themes.ts.
 */
export const N8GAMES_GAMES: N8Game[] = [corkAndBell, hotPotato, whoAmI, tinDerby, paperMasks]

export const getGame = (slug: string) => N8GAMES_GAMES.find((g) => g.slug === slug)

/** Pages whose Go play points at a game that is not on the live site yet. */
export const notLiveYet = () => N8GAMES_GAMES.filter((g) => !g.play.live).map((g) => g.slug)
