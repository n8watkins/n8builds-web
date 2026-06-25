import { builds, type Build } from './builds'

// The shelves are the "share everything" surface. They're derived from the single
// source of truth (data/builds.tsx) so adding a build = it shows up on the right shelf.
// No parallel dataset, no duplicated links.

export type Shelf = 'extension' | 'tool' | 'resource' | 'lab'

export interface ShelfMeta {
  id: Shelf
  slug: string // route segment
  label: string // nav + page title
  eyebrow: string // small uppercase tag
  heading: string
  blurb: string
}

// Slugs featured prominently elsewhere on the page (so they don't double-list in the Lab).
// appturnity -> Currently Building carousel; portfolio-rank -> Recent builds (FeaturedProjects).
const featuredElsewhere = ['appturnity', 'portfolio-rank']

export const shelfMeta: Record<Shelf, ShelfMeta> = {
  extension: {
    id: 'extension',
    slug: 'extensions',
    label: 'Extensions',
    eyebrow: 'Browser tools',
    heading: 'Chrome Extensions',
    blurb: 'Small browser tools that do one useful thing well — mostly local-first, zero-account, low-surface.',
  },
  tool: {
    id: 'tool',
    slug: 'tools',
    label: 'Tools',
    eyebrow: 'Dev tools',
    heading: 'Tools',
    blurb: 'Desktop apps, bots, and dev utilities I made because I wanted them to exist.',
  },
  resource: {
    id: 'resource',
    slug: 'resources',
    label: 'Resources',
    eyebrow: 'Free dev resources',
    heading: 'Resources',
    blurb: 'Free, browser-based developer directories I built — find self-hosted apps, free dev tiers, and public APIs without the rabbit hole. No account, nothing uploaded.',
  },
  lab: {
    id: 'lab',
    slug: 'lab',
    label: 'Lab',
    eyebrow: 'In the lab',
    heading: 'The Lab',
    blurb: 'Everything I\'m building — shipped apps, ongoing projects, and half-built experiments. This is the whole bench.',
  },
}

// Classify a build onto a shelf. Extensions, tools, and resources get their own
// shelves; everything else (web apps, experiments, "in the lab") lands in the Lab.
export function getShelf(build: Build): Shelf {
  switch (build.category) {
    case 'Chrome extension':
    case 'Starter template':
      return 'extension'
    case 'Desktop app':
    case 'Streaming tool':
    case 'GitHub Actions bot':
    case 'Web tool':
      return 'tool'
    case 'Resource':
      return 'resource'
    default:
      return 'lab'
  }
}

export function buildsForShelf(shelf: Shelf): Build[] {
  return builds.filter(
    (b) => getShelf(b) === shelf && !(shelf === 'lab' && featuredElsewhere.includes(b.slug))
  )
}

// All distinct tags present on a shelf, for the filter row.
export function tagsForShelf(shelf: Shelf): string[] {
  const set = new Set<string>()
  for (const b of buildsForShelf(shelf)) b.tags.forEach((t) => set.add(t))
  return Array.from(set).sort()
}
