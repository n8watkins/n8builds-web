import type { Build } from './builds'

// The shelves are where each build is shown on the site, derived from the
// single source of truth (data/builds.tsx), so adding a build = it shows up on
// the right shelf. No parallel dataset, no duplicated links.

// The owner's daily drivers lead /loadout's "Tools I built and use"; every other
// build is in the homepage Lab: extensions in their showcase, everything else
// (web apps and tools alike) a featured row, unless it is kept off the homepage. The Lab has no tools part (the
// owner's call, 2026-11-01): the tools I built and use are in the Loadout.
export type Shelf = 'mine' | 'featured' | 'extension' | 'index'

export interface ShelfMeta {
  id: Shelf
  /** Where the shelf is: a build page's "Back to" link goes here. */
  href: string
  label: string // the "Back to" link's name
}

export const shelfMeta: Record<Shelf, ShelfMeta> = {
  mine: { id: 'mine', href: '/loadout#tools-i-built', label: 'Tools I built and use' },
  featured: { id: 'featured', href: '/#featured', label: 'Featured' },
  extension: { id: 'extension', href: '/#extensions', label: 'Extensions' },
  // A build that isn't on the homepage (Portfolio Rank): the /builds index lists it.
  index: { id: 'index', href: '/builds', label: 'all builds' },
}

// Classify a build onto a shelf: the owner's daily drivers, the extensions
// (and the extension starter), and everything else featured.
export function getShelf(build: Build): Shelf {
  if (build.mine) return 'mine'
  if (build.homepage === false) return 'index'
  switch (build.category) {
    case 'Chrome extension':
    case 'Starter template':
      return 'extension'
    default:
      return 'featured'
  }
}
