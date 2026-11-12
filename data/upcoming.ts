/**
 * What I'm building in public ("What's cookin'"), shown on /upcoming and the
 * homepage with a waitlist. Each one has a live landing page, and since
 * 2026-11-11 every one is a working app you can try. Round 11 of 2026-11-09 (owner): /upcoming is a teaser,
 * each card the landing page's picture, the name, one line and its status
 * (round 7 had dropped statuses; they are back, read off each landing page).
 *
 * The slugs are a public contract: the projects' landing pages link to
 * `https://n8builds.dev/upcoming?interest=<slug>#<slug>`, so never rename one;
 * a renamed project keeps its old interest value working (INTEREST_ALIASES).
 * Copy comes from each project's own docs (Feelium's README and docs/PRD.md in
 * ~/projects/feelium, Cutely Ask Me's README and docs/REVIEW_2026-11.md in
 * ~/projects/polish/cutelyaskme, Who Am I?'s README in ~/projects/who-am-i,
 * Pivot's README and /welcome page in ~/projects/pivot, FitFlow 7's README in
 * ~/projects/public/fitflow7); keep it in step and modest.
 *
 * A project that leaves this list (owner, 2026-11-11: four did) leaves the
 * waitlist's forms and API with it: its slug is refused like any unknown one,
 * no announcement can be started or sent for it, and the rows people already
 * have for it stay in the database: nothing reads them or deletes them, until
 * that person leaves the waitlist or trims their own list on the manage page.
 */

export const UPCOMING_SLUGS = ['feelium', 'fitflow7', 'pivot', 'cutelyaskme', 'whoami'] as const
export type UpcomingSlug = (typeof UPCOMING_SLUGS)[number]

/**
 * Who a project is for: the homepage groups its What's cookin' list by it (round 7,
 * 2026-11-09). Since 2026-11-11 every project is an everyday-life one, so the groups
 * split those: the ones for your own habits and health, and the ones for two people.
 */
export type UpcomingGroup = 'habits' | 'two'

export const UPCOMING_GROUPS: { id: UpcomingGroup; label: string }[] = [
  { id: 'habits', label: 'For your habits & health' },
  { id: 'two', label: 'For two' },
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
   * Whether the homepage's What's cookin' list shows it (default true; every project
   * does since 2026-11-09, when the list became one compact row each). A project left
   * off still appears on /upcoming and in both waitlist forms.
   */
  homepage?: boolean
  points: string[]
}

/** In group order (UPCOMING_GROUPS), so /upcoming and the waitlist's picks read like the homepage. */
export const UPCOMING: UpcomingProject[] = [
  {
    slug: 'feelium',
    name: 'Feelium',
    tagline: 'What did I do, how did I feel, and are they connected?',
    short: 'See which habits go with how you feel',
    group: 'habits',
    summary:
      'A small daily tracker: log a few habits, check in on how you feel, and see which days went with which.',
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
    slug: 'fitflow7',
    name: 'FitFlow 7',
    tagline: 'The no-excuses 7-minute workout timer',
    short: 'A 7-minute workout timer, no account',
    group: 'habits',
    summary: 'Pick a routine, hit start and follow along, with audio cues on every move. No account, no ads, no subscription.',
    icon: '/upcoming/fitflow7.svg',
    landing: 'https://fitflow7.n8builds.dev',
    status: 'try-it',
    shot: '/upcoming/shots/fitflow7.webp',
    repo: 'n8watkins/fitflow7',
    // Its electric cyan.
    accent: '#22d3ee',
    what: 'Pick a routine, hit start and follow along: a countdown you can read across the room, color-coded phases and audio cues call out every move, and it keeps your streaks and history on your device.',
    forWho: 'Anyone who wants a quick workout at home without an account, ads or a subscription.',
    points: [
      'Start from the Classic 7 routine, or build your own with your own work and rest times',
      'Audio cues on every phase, a focus mode with just the timer, and keyboard shortcuts',
      'Streaks and history saved on your device, with no account or login',
      'Works offline after the first load, with no ads and no upsell',
    ],
  },
  {
    slug: 'pivot',
    name: 'Pivot',
    tagline: 'A pause button for everyday urges',
    short: 'One small next step when an urge hits',
    group: 'habits',
    summary: 'When the pull to scroll, snack or check your email hits, it gives you one small next step you already picked.',
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
    tagline: 'Send a cute ask, they pick the vibe, you plan the date',
    short: 'Ask someone out with a cute invite',
    group: 'two',
    summary:
      'Ask someone on a date with a cute invite: they say yes and pick the vibe, then you plan the stops and share the plan.',
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
    slug: 'whoami',
    name: 'Who Am I?',
    tagline: 'A two-player guessing game: only your opponent sees who you are',
    short: 'A two-player guessing game for your phones',
    group: 'two',
    summary: 'Each of you gets a secret identity; you see theirs, never your own. Ask yes or no questions until you work it out.',
    icon: '/upcoming/whoami.svg',
    landing: 'https://whoami.n8builds.dev',
    status: 'try-it',
    shot: '/upcoming/shots/whoami.webp',
    repo: 'n8watkins/who-am-i',
    // Its violet, lightened for this dark site.
    accent: '#9d8cff',
    what: 'Each player gets a secret identity, a famous person, a fictional character or a brand mascot. You see the one your opponent is guessing but never your own, and you take turns asking yes or no questions or giving clues until you work out who you are.',
    forWho: 'Two friends, a couple or roommates who want a quick game on their phones.',
    points: [
      'No account or install: one player creates a room, the other joins by QR code, link or PIN',
      'Ask out loud or in the app, with up to three free hints a turn',
      'Packs from actors and movie characters to historical figures, video games and mascots',
      'First to 5 points or best after 10 rounds, then a one-tap rematch',
    ],
  },
]

/** Old interest values from renamed projects, so links already out there keep working. */
export const INTEREST_ALIASES: Record<string, UpcomingSlug> = {}

export const isUpcomingSlug = (value: unknown): value is UpcomingSlug =>
  typeof value === 'string' && (UPCOMING_SLUGS as readonly string[]).includes(value)

/** The project an `interest` value points to, old names included, or null. */
export function interestSlug(value: unknown): UpcomingSlug | null {
  if (isUpcomingSlug(value)) return value
  return typeof value === 'string' ? (INTEREST_ALIASES[value] ?? null) : null
}
