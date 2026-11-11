/**
 * What I'm building in public ("What's cookin'"), shown on /upcoming and the
 * homepage with a waitlist. Each one has a live landing page; some are plans,
 * some working apps. Round 11 of 2026-11-09 (owner): /upcoming is a teaser,
 * each card the landing page's picture, the name, one line and its status
 * (round 7 had dropped statuses; they are back, read off each landing page).
 *
 * The slugs are a public contract: the projects' landing pages link to
 * `https://n8builds.dev/upcoming?interest=<slug>#<slug>`, so never rename one;
 * a renamed project keeps its old interest value working (INTEREST_ALIASES).
 * Copy comes from each project's own docs (Strollz's in ~/projects/strollz, VibeLog's README and docs/VISION.md in
 * ~/projects/polish/vibelog, KeysReady's from the owner and its landing page,
 * Asset Arsenal's docs/SKINS_CONCEPT.md in ~/projects/asset-arsenal, Feelium's
 * README and docs/PRD.md in ~/projects/feelium, Cutely Ask Me's README and
 * docs/REVIEW_2026-11.md in ~/projects/polish/cutelyaskme, Who Am I?'s README in
 * ~/projects/who-am-i, Pivot's README and /welcome page in ~/projects/pivot,
 * FitFlow 7's README in ~/projects/public/fitflow7); keep it in step and modest.
 */

export const UPCOMING_SLUGS = [
  'strollz',
  'vibelog',
  'keysready',
  'asset-arsenal',
  'feelium',
  'cutelyaskme',
  'whoami',
  'pivot',
  'fitflow7',
] as const
export type UpcomingSlug = (typeof UPCOMING_SLUGS)[number]

/** Who a project is for: the homepage groups its What's cookin' list by it (round 7, 2026-11-09). */
export type UpcomingGroup = 'business' | 'life' | 'creators'

export const UPCOMING_GROUPS: { id: UpcomingGroup; label: string }[] = [
  { id: 'business', label: 'For businesses' },
  { id: 'life', label: 'For everyday life' },
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
    slug: 'keysready',
    name: 'KeysReady',
    tagline: 'Stop answering “Is my car ready?”',
    short: 'Booking and live repair status for auto shops',
    group: 'business',
    summary:
      'For small auto repair shops: customers book online, follow their repair live, and approve and pay from their phone.',
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
  {
    slug: 'strollz',
    name: 'Strollz',
    tagline: 'Walk the streets you have never walked',
    short: 'Walking loops through new streets near you',
    group: 'life',
    summary:
      'Tell it how long you have, and it plans a walking loop from your door through streets you have not walked yet.',
    icon: '/upcoming/strollz.svg',
    landing: 'https://strollz.n8builds.dev',
    status: 'in-development',
    shot: '/upcoming/shots/strollz.webp',
    repo: 'n8watkins/strollz',
    accent: '#5cc49b',
    what: 'Tell it how long you have, and it plans a walking loop from your door through streets you have never walked, with a few short notes about what you pass, each linked to its source.',
    forWho:
      'People who just moved and want to learn the area on foot, dog walkers bored of the same loop, and parents pushing a stroller.',
    points: [
      'Pick a time (20 to 60 minutes) and choose one of three loops from your door',
      "Remembers the streets you've walked and steers each loop toward new ones",
      'Two to four short notes per walk, each with its source: no source, no note',
      'Safety and step-free filters free for everyone, and your walks stay private',
    ],
  },
  {
    slug: 'feelium',
    name: 'Feelium',
    tagline: 'What did I do, how did I feel, and are they connected?',
    short: 'See which habits go with how you feel',
    group: 'life',
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
    slug: 'cutelyaskme',
    name: 'Cutely Ask Me',
    tagline: 'Send a cute ask, they pick the vibe, you plan the date',
    short: 'Ask someone out with a cute invite',
    group: 'life',
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
    slug: 'fitflow7',
    name: 'FitFlow 7',
    tagline: 'The no-excuses 7-minute workout timer',
    short: 'A 7-minute workout timer, no account',
    group: 'life',
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
    group: 'life',
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
    slug: 'whoami',
    name: 'Who Am I?',
    tagline: 'A two-player guessing game: only your opponent sees who you are',
    short: 'A two-player guessing game for your phones',
    group: 'life',
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
  {
    slug: 'vibelog',
    name: 'VibeLog',
    tagline: 'Live coding telemetry for vibe-coding streams',
    short: 'Live coding stats for your streams',
    group: 'creators',
    summary:
      'For people who stream themselves coding with AI: it shows your commits, code changes and AI usage on screen, live.',
    icon: '/upcoming/vibelog.svg',
    landing: 'https://vibelogs.dev',
    status: 'early-access',
    shot: '/upcoming/shots/vibelog.webp',
    repo: 'n8watkins/vibelog',
    accent: '#f472b6',
    what: 'One local process tracks your git activity, Claude token spend, stream time and channel growth, and turns them into a live OBS overlay, a private dashboard, a public live page and shareable stat cards.',
    forWho: 'People who stream themselves building software with AI and want viewers to see what is actually happening.',
    points: [
      'A HUD for OBS: what you are building, commits, lines changed and tokens, live',
      'A private dashboard and an activity calendar of your coding and streaming',
      'A public live page and share cards built only from names and numbers you choose',
      'Local-first with no account; open source first, a hosted page later',
    ],
  },
  {
    slug: 'asset-arsenal',
    name: 'Asset Arsenal',
    tagline: 'Give your page a skin',
    short: 'Reskins your page, then cuts the assets',
    group: 'creators',
    summary:
      'For builders: it redraws your page in your brand or any style you name, then cuts it into assets you can ship.',
    icon: '/upcoming/asset-arsenal.svg',
    landing: 'https://assetarsenal.n8builds.dev',
    status: 'concept',
    shot: '/upcoming/shots/asset-arsenal.webp',
    accent: '#f3b73f',
    what: 'It reimagines your page in your brand or in any style you name, then breaks that picture into real assets you can ship: backgrounds, frames, buttons, icons and illustrations, each cut out and ready to drop in.',
    forWho:
      'Builders who want a site that looks like their brand rather than a template, and apps that want to offer their users a few skins to pick from.',
    points: [
      'Starts from a screenshot of your page plus your logo, colors and images',
      'A few full-page concepts in the style you describe; keep the one you love',
      'Every asset rebuilt full size on a transparent background, matching the concept',
      'Keep, reject or retry any single piece, and see the cost before each run',
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
