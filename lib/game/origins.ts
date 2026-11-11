/** The dino catch game's sites (lib/game/stats.ts). */
export const SITES = ['n8builds', 'portfolio'] as const
export type Site = (typeof SITES)[number]

/** The pages allowed to send events, and the site each one is. */
export const ORIGINS: Record<string, Site> = {
  'https://n8builds.dev': 'n8builds',
  'https://www.n8builds.dev': 'n8builds',
  'https://portfolio.n8builds.dev': 'portfolio',
}
