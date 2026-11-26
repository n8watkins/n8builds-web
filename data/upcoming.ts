/**
 * What I'm building in public ("What's cookin'"), shown on /upcoming and the
 * homepage with a waitlist. Each one has a live landing page, and every listed
 * one is a working app you can try. Round 11 of 2026-11-09 (owner): /upcoming is a teaser,
 * each card the landing page's picture, the name, one line and its status
 * (round 7 had dropped statuses; they are back, read off each landing page).
 *
 * The slugs are a public contract: the projects' landing pages link to
 * `https://n8builds.dev/upcoming?interest=<slug>#<slug>`, so never rename one;
 * a renamed project keeps its old interest value working (INTEREST_ALIASES).
 * Copy comes from each project's own docs (KeysReady's from the owner and its landing page, Feelium's
 * README and docs/PRD.md in ~/projects/apps/feelium, Cutely Ask Me's README and
 * docs/REVIEW_2026-11.md in ~/projects/apps/cutelyaskme, Pivot's README and /welcome page in
 * ~/projects/apps/pivot); keep it in step and modest.
 *
 * Removed from the waitlist on 2026-11-26 (owner): FitFlow 7 and Who Am I? (both live, so there
 * is nothing to wait for), then Strollz, VibeLog and Asset Arsenal (dropped from What's cookin').
 * Their stored sign-ups stay in the database, ignored (see isUpcomingSlug), and an old
 * `?interest=<slug>` link lands on the plain page with nothing ticked. KeysReady was unlisted
 * from 2026-11-11 and is listed again with the new copy (2026-11-26). See `unlisted` on UpcomingProject.
 */

export const UPCOMING_SLUGS = ['feelium', 'pivot', 'cutelyaskme', 'keysready'] as const
export type UpcomingSlug = (typeof UPCOMING_SLUGS)[number]

/**
 * Who a project is for: the homepage groups its What's cookin' list by it (round 7,
 * 2026-11-09). Since 2026-11-11 every listed project is an everyday-life one, so
 * two groups split those: the ones for your own habits and health, and the ones for
 * two people. A group with no listed project is not shown (the last two today).
 */
export type UpcomingGroup = 'habits' | 'two' | 'business' | 'creators'

export const UPCOMING_GROUPS: { id: UpcomingGroup; label: string }[] = [
  { id: 'habits', label: 'For your habits & health' },
  { id: 'two', label: 'For two' },
  { id: 'business', label: 'For businesses' },
  { id: 'creators', label: 'For developers & creators' },
]

export type UpcomingStatus = 'try-it' | 'early-access' | 'in-development' | 'concept'

export const STATUS_LABEL: Record<UpcomingStatus, string> = {
  'try-it': 'Try it now',
  'early-access': 'Early access',
  'in-development': 'In development',
  concept: 'Concept',
}

export type UpcomingProject = {
  slug: UpcomingSlug
  name: string
  /** Shown beside the name, for a name that isn't settled. */
  nameNote?: string
  /** Old anchors that should still land on this card (a renamed project's). */
  oldIds?: string[]
  tagline: string
  /** A few words for the homepage's compact list: what it is, at a glance. */
  short: string
  group: UpcomingGroup
  /**
   * What it does for whom, in plain words: one or two short sentences under
   * the tagline on the homepage cards (the full `what` is on /upcoming).
   */
  summary: string
  icon: string
  /** The project's landing page. */
  landing: string
  /**
   * Where it stands, as its landing page says (checked 2026-11-09): a working app
   * you can try now, early access, in development, or a concept.
   */
  status: UpcomingStatus
  /** A picture of its landing page (public/upcoming/shots, from scripts/upcoming-shots.mjs). */
  shot: string
  /** Its GitHub repository, only once the repository is public ("owner/name"). */
  repo?: string
  /** The project's own accent, for its checks and its card's edge (its shade for dark backgrounds). */
  accent: string
  what: string
  forWho: string
  /**
   * Unlisted: working, but not shown or advertised (default false; owner,
   * 2026-11-11). An unlisted project is left off the homepage, the /upcoming
   * list, the waitlist form's picks, page descriptions and share text, and
   * the build log never names or links it (its work still counts in the
   * totals). Everything behind it works as for any project: a direct link
   * (`/upcoming?interest=<slug>`) shows it in the form, ticked; the API takes
   * its slug; the manage page and the emails show it; announcements for it can
   * be previewed, tested and sent. To list a project again, delete this line.
   */
  unlisted?: boolean
  points: string[]
}

/** Every project, unlisted ones included: what the waitlist's API, emails and announcements know. To show projects, use UPCOMING_LISTED. */
export const UPCOMING: UpcomingProject[] = [
  {
    slug: 'feelium',
    name: 'Feelium',
    tagline: 'Find out what actually makes your days better.',
    short: 'See which habits go with how you feel',
    group: 'habits',
    summary:
      'Tap what you did, rate how you felt, and see what goes with your good days.',
    icon: '/upcoming/feelium.svg',
    landing: 'https://feelium.n8builds.dev',
    status: 'try-it',
    shot: '/upcoming/shots/feelium.webp',
    repo: 'n8watkins/feelium',
    // Feelium's brand is black and white; its light grey keeps the card edge visible on this dark site.
    accent: '#a3a3a3',
    what: 'Log a few behaviors with a tap, rate how you feel from 1 to 5 whenever you want, and after a couple of weeks it compares how you felt on days with and without each one, in plain words.',
    forWho: 'People who want to know whether coffee, exercise or doomscrolling actually changes how they feel, without streaks or scores.',
    points: [
      'Yes or no behaviors and number ones (cups of coffee, hours of screen time), saved as you tap',
      'Check-ins rate mood, anxiety, energy or focus from 1 to 5; a blank stays blank, never a zero',
      'Comparisons appear once a behavior has 5 days with it and 5 without, with the caveat that it is an association',
      'Private to your account, export or delete anytime, and open source',
    ],
  },
  {
    slug: 'pivot',
    name: 'Pivot',
    tagline: "Who you were isn't who you are now.",
    short: 'One small next step when an urge hits',
    group: 'habits',
    summary:
      "When an old habit pulls, Pivot gives you one small step that belongs to the person you're becoming.",
    icon: '/upcoming/pivot.svg',
    // Its landing page; the app itself is at the site's root.
    landing: 'https://pivot.n8builds.dev/welcome',
    status: 'try-it',
    shot: '/upcoming/shots/pivot.webp',
    repo: 'n8watkins/pivot',
    // Its sage green, lightened for this dark site.
    accent: '#8fbf9f',
    what: 'When the pull to scroll, snack or check your email hits, Pivot gives you one small next step you already picked, chosen from the moment, the time of day and what helped before.',
    forWho: 'Anyone changing an everyday habit who wants a calm nudge, without streaks, scores or judgment.',
    points: [
      'Free, with no account needed; signing in with GitHub is optional',
      'A pivot per habit, each with the replacement actions you approved',
      'A quick follow-up on how it went, and a history you can export or delete',
      'Crisis lines one tap away on every screen; it is not a substitute for professional care',
    ],
  },
  {
    slug: 'cutelyaskme',
    name: 'Cutely Ask Me',
    tagline: "Finding a date is hard enough. Asking shouldn't be.",
    short: 'Ask someone out with a cute invite',
    group: 'two',
    summary:
      'Send a cute invite; they pick the vibe, you plan the night.',
    icon: '/upcoming/cutelyaskme.svg',
    landing: 'https://cutelyaskme.n8builds.dev',
    status: 'try-it',
    shot: '/upcoming/shots/cutelyaskme.webp',
    repo: 'n8watkins/cutelyaskme',
    // Its brand pink (the app's theme colour).
    accent: '#ff7aaa',
    what: 'You send a personalized invite; they accept and pick the date, the time and the kind of date (activities, food, dress code). Then you choose the real places, arrange the stops on a map with travel times and a sunset-aware order, and share the plan or keep it a surprise, with a calendar invite.',
    forWho: 'Anyone asking someone out, or planning a date night for their partner, who wants it to feel thoughtful rather than a group chat.',
    points: [
      'A playful ask: a "No" button that dodges, and confetti for yes',
      'They pick the kind of date; you pick the real venues, from Google Places or OpenStreetMap',
      'A timeline with travel between stops, and Google Calendar or .ics export',
      'After the date: ratings, and a keepsake card with your photos and a short poem',
    ],
  },
  {
    slug: 'keysready',
    name: 'KeysReady',
    tagline: 'Stop wondering when your car is ready.',
    short: 'Booking and live repair status for auto shops',
    group: 'business',
    summary:
      "You get told the moment it's done, and you agree to the work and the price before anyone picks up a wrench. No more haggling at the counter. They always know where their car is, so you can stay under the hood instead of on the phone.",
    icon: '/upcoming/keysready.svg',
    landing: 'https://keysready.n8builds.dev',
    status: 'in-development',
    shot: '/upcoming/shots/keysready.webp',
    repo: 'n8watkins/keysready',
    // Signal red: #c81e1e on light backgrounds, #ff5a4e on dark ones (this site); its icon adds a ready-green, #43d095.
    accent: '#ff5a4e',
    what: 'Your customers get online booking, live repair status and estimates they approve and pay from their phone. They always know where their car is, so you can stay under the hood instead of on the phone.',
    forWho:
      'Independent 1-3 bay auto shops, mobile mechanics and other small repair shops running on paper and a phone, plus agencies building their websites.',
    points: [
      'Online booking with a link for your site or Google profile, and no app for customers',
      'Live repair status by email and browser notifications, with a status page that answers the call before it happens',
      "Estimates customers approve and pay from their phone, with money going to the shop's own Stripe account",
      'Free for a small shop and open source, so you can self-host it; Pro at $29/mo adds texts, reminders and reviews (planned)',
    ],
  },
]

/** Whether the site shows a project (see `unlisted` on UpcomingProject). */
export const isListed = (project: UpcomingProject) => project.unlisted !== true

/** The projects the site shows: the homepage, the /upcoming list and the waitlist form's picks. */
export const UPCOMING_LISTED = UPCOMING.filter(isListed)

/** The slugs of the unlisted projects, for the places that must not name them (the build log). */
export const UNLISTED_SLUGS: ReadonlySet<string> = new Set(UPCOMING.filter((p) => !isListed(p)).map((p) => p.slug))

/** Old interest values from renamed projects, so links already out there keep working. */
export const INTEREST_ALIASES: Record<string, UpcomingSlug> = {}

export const isUpcomingSlug = (value: unknown): value is UpcomingSlug =>
  typeof value === 'string' && (UPCOMING_SLUGS as readonly string[]).includes(value)

/** The project an `interest` value points to, old names included, or null. */
export function interestSlug(value: unknown): UpcomingSlug | null {
  if (isUpcomingSlug(value)) return value
  return typeof value === 'string' ? (INTEREST_ALIASES[value] ?? null) : null
}
