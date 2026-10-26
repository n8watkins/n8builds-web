import { builds, type Build } from './builds'

// The shelves are the "share everything" surface. They're derived from the single
// source of truth (data/builds.tsx) so adding a build = it shows up on the right shelf.
// No parallel dataset, no duplicated links.

// Every build sits in one part of the homepage Lab: web apps are the featured
// rows, extensions have their showcase, and tools get a card grid.
export type Shelf = 'mine' | 'featured' | 'extension' | 'tool'

export interface ShelfMeta {
  id: Shelf
  slug: string // route segment
  label: string // nav + page title
  eyebrow: string // small uppercase tag
  heading: string
  blurb: string
}

export const shelfMeta: Record<Shelf, ShelfMeta> = {
  mine: {
    id: 'mine',
    slug: 'my-tools',
    label: 'My tools',
    eyebrow: 'My tools',
    heading: 'Tools I use every day',
    blurb: 'Mine first: I run both of these every day, and so can you.',
  },
  extension: {
    id: 'extension',
    slug: 'extensions',
    label: 'Extensions',
    eyebrow: 'Browser tools',
    heading: 'Chrome Extensions',
    blurb: 'Small browser tools that do one useful thing well - mostly local-first, zero-account, low-surface.',
  },
  tool: {
    id: 'tool',
    slug: 'tools',
    label: 'Tools',
    eyebrow: 'Dev tools',
    heading: 'Tools',
    blurb: 'Desktop apps and utilities I made because I wanted them to exist.',
  },
  featured: {
    id: 'featured',
    slug: 'featured',
    label: 'Featured',
    eyebrow: 'Featured',
    heading: 'Featured builds',
    blurb: 'The apps I am proudest of right now.',
  },
}

// Classify a build onto a shelf. Extensions and tools get their own sections;
// everything else (web apps) is a featured row.
export function getShelf(build: Build): Shelf {
  if (build.mine) return 'mine'
  switch (build.category) {
    case 'Chrome extension':
    case 'Starter template':
      return 'extension'
    case 'Desktop app':
    case 'Streaming tool':
    case 'GitHub Actions bot':
    case 'Web tool':
      return 'tool'
    default:
      return 'featured'
  }
}

export function buildsForShelf(shelf: Shelf): Build[] {
  return builds.filter((b) => getShelf(b) === shelf)
}
