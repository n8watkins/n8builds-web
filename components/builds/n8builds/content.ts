/**
 * The copy and numbers behind the n8builds.dev case study (/builds/n8builds).
 *
 * Every claim here is checked against the repo: the CI workflow
 * (.github/workflows/ci.yml), the Lighthouse budgets (scripts/lighthouse.mjs)
 * and the done log in docs/NEXT_STEPS.md, where every speed number comes from.
 * Change a number only when the source it cites changes.
 */

import { VERSIONS } from '@/lib/versions'

export type FeatureIcon = 'layers' | 'edit' | 'shield' | 'lock' | 'image' | 'tag' | 'activity' | 'radio'

export interface Feature {
  icon: FeatureIcon
  title: string
  body: string
  /**
   * What it looks like on this site (owner, round 11 of 2026-11-09: real
   * screenshots, no stock or generated art; round 12: several where it helps,
   * such as a share card for each kind of page). In public/builds/n8builds/features/;
   * retake one when its feature changes.
   */
  previews?: { src: string; alt: string; label?: string; width?: number; height?: number }[]
  /** How it works, a short step each (round 12). */
  how?: string[]
}

const shot = (name: string, alt: string, label?: string) => ({ src: `/builds/n8builds/features/${name}.webp`, alt, label })
const card = (name: string, alt: string, label: string) => ({ ...shot(name, alt, label), width: 1200, height: 630 })

/**
 * What a fork starts with, the features you can see: each with pictures of it
 * on this site and how it works (owner, round 12 of 2026-11-09: a real selling
 * point, so people use this site as the template for theirs).
 */
export const FEATURES: Feature[] = [
  {
    icon: 'image',
    title: 'A share card for every page',
    body: 'A link to any page shows a card made for it, wherever it is shared.',
    previews: [
      card('og-home', "The homepage's share card: n8builds.dev and its tagline", 'The homepage'),
      card('og-post', "A blog post's share card: Welcome to N8's Notions, over the post's art", 'A blog post'),
      card('og-build', "Solara's build page share card: its name and tagline", 'A build page'),
    ],
    how: [
      'Every build page and blog post draws its own 1200x630 card with next/og, from its title and art; the homepage has one of its own.',
      'The card is in the page\'s Open Graph and X tags, so every app that unfurls links shows it.',
      'A test walks the sitemap: each page has a canonical URL, a title of its own and a card that loads.',
    ],
  },
  {
    icon: 'edit',
    title: 'A blog you write in Sanity',
    body: 'Write in Sanity Studio and publish: the post is on the site in seconds, with no deploy.',
    previews: [shot('blog', "N8's Notions: the title, topic filters and the newest posts with their covers", 'The blog'), shot('blog-post', 'A post: its topics, title, byline and cover art', 'A post')],
    how: [
      'Posts are written and published in Sanity Studio, Sanity\'s hosted editor.',
      'Publishing calls the site\'s signed webhook, which rebuilds the post and the blog\'s pages: live in seconds, no deploy.',
      'From the Studio, a draft opens on the site in preview mode, before anyone else sees it.',
    ],
  },
  {
    icon: 'layers',
    title: 'A build log that writes itself',
    body: 'Every release and user-facing commit of every build, on the homepage and at /builds.',
    previews: [shot('build-log', "The homepage's build log: the month's changes shipped, a chart by day and the latest releases", 'On the homepage'), shot('builds-page', 'The build log at /builds: totals, the busiest build and every build by latest activity', 'At /builds')],
    how: [
      'Each build is one entry in a typed file (data/builds.tsx), pointing at its GitHub repo.',
      'Every hour the site reads each repo\'s releases and commits from GitHub.',
      'Commit subjects written as patch notes become the entries; chores, tests and docs stay out.',
    ],
  },
  {
    icon: 'radio',
    title: 'A live-stream corner player',
    body: 'Live on Twitch, YouTube or X? A player opens in the corner of every page.',
    previews: [shot('live-player', 'The corner player while live on Twitch: the stream, its title, Unmute and Watch on Twitch')],
    how: [
      'The site checks whether a stream is live on Twitch, YouTube or X.',
      'When one is, a corner player opens on every page and the navbar shows a live dot.',
      'It can be moved, made bigger or closed, and a switch in Sanity Studio goes live by hand.',
    ],
  },
  {
    icon: 'shield',
    title: 'A contact form that stops spam',
    body: 'Real messages get through; bots, floods and outages do not.',
    previews: [shot('contact', 'The contact form: name, email, a topic picked from cards and the message, protected by Cloudflare Turnstile')],
    how: [
      'Each message is checked: a Zod schema, a honeypot field and a Turnstile token issued for this site.',
      'Rate limits in Durable Objects: five messages an hour per visitor, and a daily cap for the whole site.',
      'If Turnstile or the limits can\'t be reached, it refuses and shows the email address instead: it fails closed.',
      'Messages go out from contact@n8builds.dev through mailroom, a shared Worker that caps every app\'s email on Cloudflare Email Service.',
    ],
  },
  {
    icon: 'tag',
    title: 'Releases that write themselves',
    body: 'Versions, changelogs and release notes, from the commits (release-kit).',
    previews: [shot('releases', "release-kit's page on this site: Releases that write themselves", 'release-kit'), shot('gh-release', "This site's v1.3.0 GitHub Release: the notes, written for users", 'A release')],
    how: [
      'Every commit is a Conventional Commit, checked by a hook as it is written and again in CI.',
      'One command picks the next version from the commits, writes the changelog and pushes the tag.',
      'The tag publishes the GitHub Release, and the notes feed the build log.',
    ],
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

/** The stack, each with the version this build is on (lib/versions.ts reads them when it is built). */
export const STACK = [
  `Next.js ${VERSIONS.next}`,
  `React ${VERSIONS.react}`,
  `TypeScript ${VERSIONS.typescript}`,
  `Tailwind CSS ${VERSIONS.tailwind}`,
  `OpenNext ${VERSIONS.opennext}`,
  'Cloudflare Workers',
  'Cloudflare D1',
  `Sanity client ${VERSIONS.sanity}`,
  `Sentry ${VERSIONS.sentry}`,
  `Playwright ${VERSIONS.playwright}`,
  `Vitest ${VERSIONS.vitest}`,
  'Lighthouse',
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
