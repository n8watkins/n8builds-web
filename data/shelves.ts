import { builds, type Build } from './builds'

// The shelves are the "share everything" surface. They're derived from the single
// source of truth (data/builds.tsx) so adding a build = it shows up on the right shelf.
// No parallel dataset, no duplicated links.

export type Shelf = 'project' | 'extension' | 'tool' | 'lab'

export interface ShelfMeta {
  id: Shelf
  slug: string // route segment
  label: string // nav + page title
  eyebrow: string // small uppercase tag
  heading: string
  blurb: string
}

export const shelfMeta: Record<Shelf, ShelfMeta> = {
  project: {
    id: 'project',
    slug: 'projects',
    label: 'Projects',
    eyebrow: 'The work',
    heading: 'Projects',
    blurb: 'Full apps I\'ve built and shipped. The proof-of-work spine — pick one to read how it was made.',
  },
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
  lab: {
    id: 'lab',
    slug: 'lab',
    label: 'Lab',
    eyebrow: 'In the lab',
    heading: 'The Lab',
    blurb: 'Half-built experiments and things still cooking. Rougher edges, on purpose — this is the bleeding edge of the bench.',
  },
}

// Classify a build onto a shelf. "in the lab" status always wins → /lab.
export function getShelf(build: Build): Shelf {
  if (build.status === 'in the lab') return 'lab'
  switch (build.category) {
    case 'Chrome extension':
    case 'Starter template':
      return 'extension'
    case 'Desktop app':
    case 'Streaming tool':
    case 'GitHub Actions bot':
      return 'tool'
    default:
      // Web app, Web app + extension, anything else
      return 'project'
  }
}

export function buildsForShelf(shelf: Shelf): Build[] {
  return builds.filter((b) => getShelf(b) === shelf)
}

// All distinct tags present on a shelf, for the filter row.
export function tagsForShelf(shelf: Shelf): string[] {
  const set = new Set<string>()
  for (const b of buildsForShelf(shelf)) b.tags.forEach((t) => set.add(t))
  return Array.from(set).sort()
}
