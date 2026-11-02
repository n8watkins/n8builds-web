/**
 * Projects I'm outlining in public, shown on /upcoming with a waitlist.
 * Nothing here is built yet: each one is a written plan and a landing page.
 *
 * The slugs are a public contract: the projects' landing pages link to
 * `https://n8builds.dev/upcoming?interest=<slug>#<slug>`, so never rename one;
 * a renamed project keeps its old interest value working (INTEREST_ALIASES).
 * Copy comes from each project's own docs (Relink's in ~/projects/deadlink,
 * Strollz's in ~/projects/strollz, VibeLog's README and docs/VISION.md in
 * ~/projects/polish/vibelog); keep it in step and modest.
 */

export const UPCOMING_SLUGS = ['relink', 'strollz', 'vibelog'] as const
export type UpcomingSlug = (typeof UPCOMING_SLUGS)[number]

export type UpcomingProject = {
  slug: UpcomingSlug
  name: string
  /** Shown beside the name, for a name that isn't settled. */
  nameNote?: string
  /** Old anchors that should still land on this card (a renamed project's). */
  oldIds?: string[]
  tagline: string
  icon: string
  /** The project's landing page. */
  landing: string
  /** The project's own accent, for its checks and its card's edge. */
  accent: string
  what: string
  forWho: string
  status: 'Outlining'
  stage: string
  points: string[]
}

export const UPCOMING: UpcomingProject[] = [
  {
    slug: 'relink',
    name: 'Relink',
    nameNote: 'working name',
    oldIds: ['rewire'],
    tagline: 'The open-source 404 safety net',
    icon: '/upcoming/relink.svg',
    landing: 'https://relink.n8builds.dev',
    accent: '#ff8a4c',
    what: "A Cloudflare edge Worker catches broken links the moment a visitor hits them, matches each one to the right page using your site's own content, and turns the fix into a permanent redirect with one click.",
    forWho:
      'Developers and indie site owners on Cloudflare, agencies rebuilding client sites, and blogs and docs whose URLs keep moving.',
    status: 'Outlining',
    stage: 'Landing page only, no product yet',
    points: [
      'Catches a 404 at the edge, before the visitor sees an error page',
      "Matches the missing URL to the right page from your site's own content",
      "Unsure matches get a 'did you mean' page that stays an honest 404",
      'Open source: self-host it free on your own Cloudflare first, hosted plans later',
    ],
  },
  {
    slug: 'strollz',
    name: 'Strollz',
    tagline: 'Walk the streets you have never walked',
    icon: '/upcoming/strollz.svg',
    landing: 'https://strollz.n8builds.dev',
    accent: '#5cc49b',
    what: 'Tell it how long you have, and it plans a walking loop from your door through streets you have never walked, with a few short notes about what you pass, each linked to its source.',
    forWho:
      'People who just moved and want to learn the area on foot, dog walkers bored of the same loop, and parents pushing a stroller.',
    status: 'Outlining',
    stage: 'Landing page only, pilot planned in Los Angeles',
    points: [
      'Pick a time (20 to 60 minutes) and choose one of three loops from your door',
      "Remembers the streets you've walked and steers each loop toward new ones",
      'Two to four short notes per walk, each with its source: no source, no note',
      'Safety and step-free filters free for everyone, and your walks stay private',
    ],
  },
  {
    slug: 'vibelog',
    name: 'VibeLog',
    tagline: 'Live coding telemetry for vibe-coding streams',
    icon: '/upcoming/vibelog.svg',
    landing: 'https://vibelogs.dev',
    accent: '#f472b6',
    what: 'One local process tracks your git activity, Claude token spend, stream time and channel growth, and turns them into a live OBS overlay, a private dashboard, a public live page and shareable stat cards.',
    forWho: 'People who stream themselves building software with AI and want viewers to see what is actually happening.',
    status: 'Outlining',
    stage: 'An early version runs on my machine; not released',
    points: [
      'A HUD for OBS: what you are building, commits, lines changed and tokens, live',
      'A private dashboard and an activity calendar of your coding and streaming',
      'A public live page and share cards built only from names and numbers you choose',
      'Local-first with no account; open source first, a hosted page later',
    ],
  },
]

/** The waitlist link for one project: the URL contract the landing pages use too. */
export const waitlistHref = (slug: UpcomingSlug) => `/upcoming?interest=${slug}#${slug}`

/** Old interest values from renamed projects, so links already out there keep working. */
export const INTEREST_ALIASES: Record<string, UpcomingSlug> = { rewire: 'relink' }

export const isUpcomingSlug = (value: unknown): value is UpcomingSlug =>
  typeof value === 'string' && (UPCOMING_SLUGS as readonly string[]).includes(value)

/** The project an `interest` value points to, old names included, or null. */
export function interestSlug(value: unknown): UpcomingSlug | null {
  if (isUpcomingSlug(value)) return value
  return typeof value === 'string' ? (INTEREST_ALIASES[value] ?? null) : null
}
