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
}

/** What a fork starts with. */
export const FEATURES: Feature[] = [
  {
    icon: 'layers',
    title: 'The Lab and a build log',
    body: 'Every build lives in one typed file. The /builds log reads each one\'s releases and commits from GitHub, refreshed hourly.',
  },
  {
    icon: 'edit',
    title: 'A blog on Sanity',
    body: 'Posts come through Sanity\'s CDN client, so a new post needs no deploy. Each one gets a generated cover.',
  },
  {
    icon: 'shield',
    title: 'A contact form that fails closed',
    body: 'Zod, a honeypot, Turnstile and Upstash rate limits. If Turnstile or Redis is down, it refuses and asks for an email.',
  },
  {
    icon: 'lock',
    title: 'Strict security headers',
    body: 'An enforced CSP lists every third-party origin, beside COOP and a Permissions-Policy. A test fails on any violation.',
  },
  {
    icon: 'image',
    title: 'A share card for every page',
    body: '1200x630 cards drawn with next/og. A test walks the sitemap for canonical URLs, unique titles and images that load.',
  },
  {
    icon: 'tag',
    title: 'Releases from commits',
    body: 'Conventional Commits, enforced by a hook and CI. One command bumps the version, writes the changelog and tags it.',
  },
  {
    icon: 'activity',
    title: 'Errors without the weight',
    body: 'Sentry loads once the page is idle, through a same-origin tunnel. Errors from before it loads are queued, not lost.',
  },
  {
    icon: 'radio',
    title: 'A live-stream corner player',
    body: 'Twitch, YouTube and X, with a live dot in the navbar and a switch in Sanity Studio to go live by hand.',
  },
]

export const STACK = [
  'Next.js 16',
  'React 19',
  'TypeScript',
  'Tailwind CSS 4',
  'Sanity',
  'Vercel',
  'Cloudflare',
  'Upstash Redis',
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
