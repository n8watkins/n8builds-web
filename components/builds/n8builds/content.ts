/**
 * The copy and numbers behind the n8builds.dev case study (/builds/n8builds).
 *
 * Every claim here is checked against the repo: the CI workflow
 * (.github/workflows/ci.yml), the Lighthouse budgets (scripts/lighthouse.mjs)
 * and the done log in docs/NEXT_STEPS.md, where every speed number comes from.
 * Change a number only when the source it cites changes.
 */

export type FeatureIcon = 'layers' | 'edit' | 'shield' | 'lock' | 'image' | 'tag' | 'activity' | 'radio'

export interface Feature {
  icon: FeatureIcon
  title: string
  body: string
  /**
   * A picture of the feature on this site (owner, round 11 of 2026-11-09: a real
   * screenshot of each, no stock or generated art), 960x600 in
   * public/builds/n8builds/features/. Retake one when its feature changes.
   */
  shot?: { src: string; alt: string }
}

/** What a fork starts with: the features you can see, each with its picture. */
export const FEATURES: Feature[] = [
  {
    icon: 'layers',
    title: 'The Lab and a build log',
    body: 'Every build in one typed file; the log reads its releases and commits from GitHub, hourly.',
    shot: { src: '/builds/n8builds/features/build-log.webp', alt: "The homepage's build log: November's 263 changes shipped, a chart by day, and the latest releases" },
  },
  {
    icon: 'edit',
    title: 'A blog on Sanity',
    body: 'Write in Sanity Studio and the post is live: no deploy, and a cover is drawn for it.',
    shot: { src: '/builds/n8builds/features/blog.webp', alt: "N8's Notions, the blog: its title, topic filters and the newest posts with their covers" },
  },
  {
    icon: 'image',
    title: 'A share card for every page',
    body: '1200x630 cards drawn on the server, checked by a test that walks the sitemap.',
    shot: { src: '/builds/n8builds/features/share-card.webp', alt: "A blog post's share card, as generated: the N8 mark, Building in public and the post's title" },
  },
  {
    icon: 'radio',
    title: 'A live-stream corner player',
    body: 'Live on Twitch, YouTube or X? A corner player opens, and the navbar shows a live dot.',
    shot: { src: '/builds/n8builds/features/live-player.webp', alt: 'The corner player over the homepage while live on Twitch: the stream, its title, Unmute and Watch on Twitch' },
  },
  {
    icon: 'shield',
    title: 'A contact form that fails closed',
    body: 'Turnstile, a honeypot and rate limits; if a check is down, it asks for an email instead.',
    shot: { src: '/builds/n8builds/features/contact.webp', alt: 'The contact form: name, email, a topic picked from cards, the message and Send Message, protected by Cloudflare Turnstile' },
  },
  {
    icon: 'tag',
    title: 'Releases from commits',
    body: 'Conventional Commits in, version, changelog and tag out, with one command (release-kit).',
    shot: { src: '/builds/n8builds/features/releases.webp', alt: "release-kit's page on this site: Releases that write themselves, and what it does" },
  },
]

/** The rest of what a fork starts with: nothing to look at, so a line each. */
export const UNDER_THE_HOOD: Feature[] = [
  {
    icon: 'lock',
    title: 'Strict security headers',
    body: 'An enforced CSP naming every third-party origin, COOP and a Permissions-Policy; a test fails on any violation.',
  },
  {
    icon: 'activity',
    title: 'Errors without the weight',
    body: 'Sentry loads once the page is idle, through a same-origin tunnel; errors from before are queued.',
  },
]

export const STACK = [
  'Next.js 16',
  'React 19',
  'TypeScript',
  'Tailwind CSS 4',
  'Sanity',
  'Cloudflare',
  'Cloudflare D1',
  'Sentry',
  'Playwright',
  'Vitest',
  'Lighthouse 13',
]

/** The E2E matrix in ci.yml: one parallel job per Playwright project. */
export const E2E_PROJECTS = ['API', 'Chromium', 'Firefox', 'WebKit', 'Pixel 7', 'iPhone 14']

/**
 * A before/after measurement from the done log. `from` and `to` drive the
 * count; `before` and `after` are what the card says (ranges stay ranges).
 */
export interface SpeedResult {
  label: string
  where: string
  before: string
  after: string
  /** The animated part of `after`: counts from `from` to `to`. */
  count: { from: number; to: number; prefix?: string; suffix?: string; pad?: boolean }
  /** Text after the counted part, e.g. the top of a range. */
  rest?: string
  /** Lower is better (sizes, times, layout shift). */
  lowerIsBetter: boolean
  /** Bar lengths, relative to the larger of the two (0-1). */
  bars: { before: number; after: number }
  source: string
}

export const SPEED: SpeedResult[] = [
  {
    label: 'Mobile performance',
    where: 'Lighthouse, homepage',
    before: '0.77',
    after: '0.87-0.90',
    count: { from: 77, to: 87, prefix: '0.', pad: true },
    rest: '-0.90',
    lowerIsBetter: false,
    bars: { before: 0.77, after: 0.9 },
    source: 'PRs #39 and #44',
  },
  {
    label: 'First-load JavaScript',
    where: 'Homepage, transferred',
    before: '405 KB',
    after: '270 KB',
    count: { from: 405, to: 270, suffix: ' KB' },
    lowerIsBetter: true,
    bars: { before: 1, after: 270 / 405 },
    source: 'PR #44',
  },
  {
    label: 'Total blocking time',
    where: 'Mobile Lighthouse, homepage',
    before: '255 ms',
    after: '80-200 ms',
    count: { from: 255, to: 80 },
    rest: '-200 ms',
    lowerIsBetter: true,
    bars: { before: 1, after: 200 / 255 },
    source: 'PR #44',
  },
  {
    label: 'Layout shift',
    where: 'Homepage CLS',
    before: '0.29',
    after: '0.000',
    count: { from: 29, to: 0, prefix: '0.', suffix: '0', pad: true },
    lowerIsBetter: true,
    bars: { before: 1, after: 0 },
    source: 'Nightly Lighthouse fix',
  },
]

/** The smaller wins from the same PRs, shown as a line each. */
export const SPEED_MORE = [
  { label: '/blog mobile performance', before: '0.86', after: '0.95-0.98' },
  { label: '/builds mobile performance', before: '0.87', after: '0.91-0.96' },
  { label: 'Homepage HTML, before compression', before: '469 KB', after: '348 KB' },
]

/** How a change gets made, from plan to release. */
export const WORKFLOW = [
  { title: 'Plan', body: 'Features are planned in docs in the repo, next to the code.' },
  { title: 'Build in parallel', body: 'Claude Code agents work in separate git worktrees, one branch each.' },
  { title: 'Pull request', body: 'Every change lands as a PR. Branch protection waits for CI.' },
  { title: 'Release', body: 'Merged feat and fix commits become the release notes and the public build log.' },
]
