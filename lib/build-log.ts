import { cache } from 'react'
import { builds as allBuilds, type Build } from '@/data/builds'
import { logger } from '@/lib/logger'

/**
 * The /builds log: what shipped across the builds, fed automatically from
 * GitHub (releases, version-bump commits and filtered commits) plus optional
 * hand-written highlights from Sanity (`logEntry` documents).
 *
 * Everything below `getBuildLog` is pure and unit-tested against a fixture of
 * real commits from the tracked repos (tests/fixtures/build-log-github.json).
 * BUILD_LOG_FIXTURE=1 swaps the GitHub and Sanity fetchers for that fixture,
 * so the E2E suite and Lighthouse never depend on live activity or rate limits.
 */

// ---------------------------------------------------------------------------
// Types

/** A repo as the fetcher returns it: GitHub's API trimmed to what the log uses. */
export type RepoSnapshot = {
  repo: string
  pushedAt: string | null
  releases: SnapshotRelease[]
  /** Newest first. Only the header line of each message is kept. */
  commits: SnapshotCommit[]
}

export type SnapshotRelease = {
  tag: string
  name: string
  publishedAt: string
  url: string
  draft: boolean
  prerelease: boolean
}

export type SnapshotCommit = {
  sha: string
  message: string
  /** When it landed on the default branch (the committer date). */
  date: string
  /** GitHub login, else the git author name; bots end in `[bot]`. */
  author: string | null
  parents: number
  url: string
}

export type HighlightKind = 'shipped' | 'fixed' | 'learned' | 'next'

/** A hand-written Sanity `logEntry`. */
export type Highlight = {
  id: string
  /** `YYYY-MM-DD`. */
  date: string
  /** Slug of the build it is about. */
  build: string
  kind: HighlightKind
  title: string
  note?: string
  link?: string
  imageUrl?: string
  imageAlt?: string
}

export type LogEntry = {
  id: string
  /** Slug of the build. */
  build: string
  kind: 'release' | 'change' | 'highlight'
  /** ISO timestamp of the newest thing in the entry. */
  date: string
  /** Calendar day and month in the owner's time zone: `YYYY-MM-DD`, `YYYY-MM`. */
  day: string
  month: string
  /** "Oct 24". */
  dayLabel: string
  title: string
  /** A release day's strongest change, or a highlight's note. */
  detail?: string
  /** Changes from the same day folded into this entry ("and N more changes"). */
  more: number
  url?: string
  highlightKind?: HighlightKind
  image?: { url: string; alt: string }
}

export type BuildActivity = {
  slug: string
  name: string
  tagline: string
  category: string
  color: string
  /** Newest release or change, ISO. Null when the log has nothing for it. */
  lastShipped: string | null
  /** "Oct 2026". */
  lastShippedLabel: string | null
  /** The newest entries, for the index card. */
  latest: LogEntry[]
}

export type BuildLog = {
  /** Feed order: month by month, newest first, highlights pinned atop their month. */
  entries: LogEntry[]
  /** Every build, most recently active first. */
  activity: BuildActivity[]
  /** Month labels for the feed headings: `{ '2026-10': 'October 2026' }`. */
  months: Record<string, string>
  /** The oldest month the feed shows before "show more" (12 months back from the newest entry). */
  recentFrom: string | null
}

// ---------------------------------------------------------------------------
// Dates. Days and months are the owner's (Los Angeles), so a late-evening
// commit lands on the day it was made, not the next UTC day.

export const LOG_TIME_ZONE = 'America/Los_Angeles'

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: LOG_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const shortDayFormat = new Intl.DateTimeFormat('en-US', { timeZone: LOG_TIME_ZONE, month: 'short', day: 'numeric' })
const monthYearFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', year: 'numeric' })
const longMonthFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })

/** `YYYY-MM-DD` of an ISO timestamp, in the log's time zone. */
export const dayKey = (iso: string) => dayFormat.format(new Date(iso))

/** A `YYYY-MM-DD` day as a UTC noon date, for formatting it without shifting it. */
const fromDay = (day: string) => new Date(`${day}T12:00:00Z`)

/** "Oct 2026": the builds index never says "N months ago", so quiet builds read as finished, not abandoned. */
export const monthYearLabel = (iso: string) => monthYearFormat.format(fromDay(dayKey(iso)))

/** "October 2026" for a `YYYY-MM` month. */
export const monthLabel = (month: string) => longMonthFormat.format(fromDay(`${month}-01`))

// ---------------------------------------------------------------------------
// Commit filtering

/** Conventional Commit types that reach the log, by strength. Every other type is dropped. */
const KEEP_TYPES: Record<string, number> = { feat: 3, perf: 2, security: 2, fix: 1 }

/**
 * Plain-sentence commits ("Add a setup script") are kept when they start with
 * one of these verbs; the number is how strongly the message reads as news.
 * Upkeep verbs (update, upgrade, bump, remove, rename, refactor, tidy...) are
 * deliberately absent.
 */
const VERBS: Record<string, number> = {
  add: 3, ship: 3, launch: 3, introduce: 3, support: 3, enable: 3, implement: 3, create: 3,
  allow: 3, let: 3, show: 3, surface: 3, build: 3, wire: 3, publish: 3, release: 3,
  redesign: 3, rebuild: 3, offer: 3,
  make: 2, improve: 2, speed: 2, lower: 2, reduce: 2, cut: 2, polish: 2, simplify: 2, rework: 2,
  replace: 2, restyle: 2, move: 2, share: 2, hide: 2, use: 2, run: 2, verify: 2, protect: 2,
  harden: 2, handle: 2, restore: 2, prevent: 2, stop: 2, detect: 2, redirect: 2, cache: 2,
  persist: 2, expand: 2, extend: 2, translate: 2, finish: 2, serve: 2,
  fix: 1, correct: 1, resolve: 1, repair: 1, abort: 1,
}

/**
 * Upkeep that slips past the type and verb rules: repo docs and legal pages,
 * test and CI plumbing, review clean-ups.
 */
const NOISE =
  /\b(HANDOFF|README|CHANGELOG|LICENSE|AGENTS\.md|CLAUDE\.md|[\w-]+\.md|\.?gitignore|docs?|roadmap|runbook|privacy policy|e2e|tests?|harness|lint(?:ing)?|CI|pre-commit|dependabot|typos?|flak(?:e|es|y)|code[- ]?review|review findings?|adversarial[- ]review)\b/i

/**
 * Internal work that reads as process, not news: sprints, audits, batches,
 * coverage numbers and phase codes ("V2 P7a: ..."). Checked after the noise
 * filter, on the cleaned title.
 */
const INTERNAL = /\b(sprints?|audits?|batch(?:es)?|coverage|compliance|backlog|tickets?|P\d+[a-z]?)\b/i

/** Three or more separate numbers ("1692 live, 44 dead, 43 error") read as an operations log. */
const NUMBER_HEAVY = (text: string) => (text.match(/\b\d+\b/g) ?? []).length >= 3

/** `type(scope)!: subject`. */
const CONVENTIONAL = /^([a-z]+)(?:\(([^()]*)\))?!?:\s*(\S.*)$/

const SEMVER = String.raw`(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)`

/** A version-bump commit: "build(tube-vault): v0.3.80", "chore(release): v1.2.0", "Bump to v0.4.0; show the version". */
const VERSION_BUMP = new RegExp(
  String.raw`^(?:(?:build|chore|release)(?:\([^()]*\))?!?:\s*)?(?:(?:release|version|bump(?: version)?(?: to)?)\s+)?v?${SEMVER}(?:$|[;,]\s)`,
  'i',
)

/** A version with its notes in the message: "v1.0.6: fix tab isolation, add a Stop shortcut". */
const VERSION_NOTES = new RegExp(String.raw`^v${SEMVER}:\s+(\S.*)$`)

/** "Feature area: what changed", with a capitalised area of up to four words ("Scheduled activities: see, open..."). Named features read as news. */
const AREA_PREFIX = /^[A-Z][\w.+/&-]*(?: [\w.+/&-]+){0,3}: \S/

export type CommitVerdict =
  | { kind: 'drop'; reason: string }
  | { kind: 'version'; version: string; notes?: string }
  | { kind: 'change'; title: string; score: number }

export const isBot = (author: string | null) => !!author && /\[bot\]$|-bot$/i.test(author)

/** Decide what a commit becomes in the log. */
export function classifyCommit(commit: Pick<SnapshotCommit, 'message' | 'author' | 'parents'>): CommitVerdict {
  const header = commit.message.split('\n')[0].trim()
  if (isBot(commit.author)) return { kind: 'drop', reason: 'bot' }
  if (commit.parents > 1 || /^Merge (pull request|branch|remote-tracking)\b/.test(header)) return { kind: 'drop', reason: 'merge' }

  const noted = VERSION_NOTES.exec(header)
  if (noted) {
    const notes = cleanTitle(noted[2])
    return { kind: 'version', version: `v${noted[1]}`, notes: NOISE.test(notes) ? undefined : notes }
  }
  const bump = VERSION_BUMP.exec(header)
  if (bump) return { kind: 'version', version: `v${bump[1]}` }

  let subject = header
  let score: number | undefined
  const conventional = CONVENTIONAL.exec(header)
  if (conventional) {
    const [, type, scope, rest] = conventional
    score = KEEP_TYPES[type]
    if (!score) return { kind: 'drop', reason: `type ${type}` }
    if (scope && /^(review|deps?|docs|tests?|ci)$/i.test(scope)) return { kind: 'drop', reason: `scope ${scope}` }
    subject = rest
  } else {
    const verb = header.split(/[\s:,]/)[0].toLowerCase()
    score = VERBS[verb] ?? (AREA_PREFIX.test(header) ? 3 : undefined)
    if (!score) return { kind: 'drop', reason: 'no verb' }
  }

  if (NOISE.test(subject)) return { kind: 'drop', reason: 'upkeep' }
  const title = cleanTitle(subject)
  // On the cleaned title, so stripped work codes ("(W4-A)", "(#67)") don't count.
  if (INTERNAL.test(title) || NUMBER_HEAVY(title)) return { kind: 'drop', reason: 'internal' }
  if (title.length < 8) return { kind: 'drop', reason: 'too short' }
  return { kind: 'change', title, score }
}

const MAX_TITLE = 110

/** Make a commit subject read like a sentence on the page. */
export function cleanTitle(subject: string): string {
  let text = subject
    .replace(/\s*—\s*/g, ' - ') // the site never shows an em dash
    .replace(/\s+/g, ' ')
    .trim()
  // Trailing PR numbers and work-item codes: "(#69)", "(W4-E)", "(D8)".
  for (let prev = ''; prev !== text; ) {
    prev = text
    text = text.replace(/\s*\((?:#\d+|(?=[A-Z0-9-]*\d)[A-Z][A-Z0-9-]{0,7})\)$/, '').replace(/[.;,\s]+$/, '')
  }
  text = text.charAt(0).toUpperCase() + text.slice(1)
  if (text.length <= MAX_TITLE) return text
  const cut = text.slice(0, MAX_TITLE - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.+&-]+$/, '')}…`
}

// ---------------------------------------------------------------------------
// From a repo to log entries

const compareVersions = (a: string, b: string) => {
  const pa = a.replace(/^v/, '').split(/[.-]/).map((p) => Number.parseInt(p, 10) || 0)
  const pb = b.replace(/^v/, '').split(/[.-]/).map((p) => Number.parseInt(p, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  }
  return 0
}

type Version = { version: string; date: string; url: string; notes?: string }
type Change = { title: string; score: number; date: string; url: string }

/**
 * A build's entries from its repo, one per day: a day with a release is a
 * "Shipped vX.Y.Z" entry for its newest version (releases always outrank
 * commits) whose detail is that version's notes or the day's strongest change;
 * any other day is its strongest change, plus "and N more changes".
 */
export function entriesForBuild(build: Pick<Build, 'slug' | 'log' | 'github' | 'logHide'>, snapshot: RepoSnapshot): LogEntry[] {
  const mode = build.log ?? 'commits'
  if (mode === 'off') return []
  // Builds without a public GitHub link (a private repo) get no links into it.
  const link = (url: string) => (build.github ? url : undefined)
  // The owner's escape hatch: hide any entry whose title contains one of these.
  const hide = (build.logHide ?? []).map((h) => h.toLowerCase())
  const hidden = (title: string) => hide.some((h) => title.toLowerCase().includes(h))

  const versions: Version[] = snapshot.releases
    .filter((r) => !r.draft && !r.prerelease)
    .map((r) => ({ version: r.tag.startsWith('v') ? r.tag : `v${r.tag}`, date: r.publishedAt, url: r.url }))
  const released = new Set(versions.map((v) => v.version))

  const changes: Change[] = []
  for (const commit of snapshot.commits) {
    const verdict = classifyCommit(commit)
    if (verdict.kind === 'version') {
      // A repo with GitHub Releases also has a release commit per tag; count it once.
      if (!released.has(verdict.version)) versions.push({ version: verdict.version, date: commit.date, url: commit.url, notes: verdict.notes })
    } else if (verdict.kind === 'change' && mode === 'commits' && !hidden(verdict.title)) {
      changes.push({ title: verdict.title, score: verdict.score, date: commit.date, url: commit.url })
    }
  }

  const days = new Map<string, { versions: Version[]; changes: Change[] }>()
  const dayOf = (key: string) => days.get(key) ?? days.set(key, { versions: [], changes: [] }).get(key)!
  for (const v of versions) dayOf(dayKey(v.date)).versions.push(v)
  for (const c of changes) dayOf(dayKey(c.date)).changes.push(c)

  const entries: LogEntry[] = []
  for (const [day, items] of days) {
    // Strongest first; between equals, the newest.
    const ranked = [...items.changes].sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
    const newest = [...items.versions.map((v) => v.date), ...items.changes.map((c) => c.date)].sort().at(-1)!
    const base = { build: build.slug, date: newest, day, month: day.slice(0, 7), dayLabel: shortDayFormat.format(fromDay(day)) }

    if (items.versions.length) {
      const latest = [...items.versions].sort((a, b) => compareVersions(b.version, a.version))[0]
      entries.push({
        ...base,
        id: `${build.slug}:${day}:release`,
        kind: 'release',
        title: `Shipped ${latest.version}`,
        // The release's own notes when its commit has them, else the day's strongest change.
        detail: latest.notes ?? ranked[0]?.title,
        more: latest.notes ? ranked.length : Math.max(ranked.length - 1, 0),
        url: link(latest.url),
      })
    } else {
      entries.push({
        ...base,
        id: `${build.slug}:${day}:change`,
        kind: 'change',
        title: ranked[0].title,
        more: ranked.length - 1,
        url: link(ranked[0].url),
      })
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

/** A Sanity highlight as a log entry. */
export function highlightEntry(h: Highlight): LogEntry {
  return {
    id: `highlight:${h.id}`,
    build: h.build,
    kind: 'highlight',
    // Noon in Los Angeles, so the day never shifts.
    date: `${h.date}T20:00:00.000Z`,
    day: h.date,
    month: h.date.slice(0, 7),
    dayLabel: shortDayFormat.format(fromDay(h.date)),
    title: h.title,
    detail: h.note || undefined,
    more: 0,
    url: h.link || undefined,
    highlightKind: h.kind,
    image: h.imageUrl ? { url: h.imageUrl, alt: h.imageAlt ?? '' } : undefined,
  }
}

/**
 * Feed order: newest month first; within a month the highlights are pinned
 * above the automatic entries; then newest first, then by the builds' order.
 */
export function sortEntries(entries: LogEntry[], buildOrder: string[] = []): LogEntry[] {
  const rank = (slug: string) => {
    const i = buildOrder.indexOf(slug)
    return i === -1 ? buildOrder.length : i
  }
  return [...entries].sort(
    (a, b) =>
      b.month.localeCompare(a.month) ||
      Number(b.kind === 'highlight') - Number(a.kind === 'highlight') ||
      b.date.localeCompare(a.date) ||
      rank(a.build) - rank(b.build),
  )
}

/** The first month inside the feed's initial window: `months` months back from the newest entry, inclusive. */
export function recentFrom(entries: LogEntry[], months = 12): string | null {
  const newest = entries.map((e) => e.month).sort().at(-1)
  if (!newest) return null
  const [year, month] = newest.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1 - (months - 1), 1))
  return start.toISOString().slice(0, 7)
}

/**
 * Every build with its latest activity, most recently active first. A build
 * with no entries sorts by its last push, then by its place in data/builds.
 */
export function buildActivity(builds: Build[], entries: LogEntry[], pushedAt: Record<string, string | null> = {}): BuildActivity[] {
  const rows = builds.map((build, index) => {
    const own = entries.filter((e) => e.build === build.slug).sort((a, b) => b.date.localeCompare(a.date))
    const shipped = own.find((e) => e.kind !== 'highlight' || e.highlightKind === 'shipped' || e.highlightKind === 'fixed')
    const sortKey = own[0]?.date ?? (build.repo ? pushedAt[build.repo] : null) ?? ''
    return {
      index,
      sortKey,
      row: {
        slug: build.slug,
        name: build.name,
        tagline: build.tagline,
        category: build.category,
        color: build.color,
        lastShipped: shipped?.date ?? null,
        lastShippedLabel: shipped ? monthYearLabel(shipped.date) : null,
        latest: own.slice(0, 2),
      },
    }
  })
  return rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey) || a.index - b.index).map((r) => r.row)
}

/** Whether the log follows a build: it has a repo and its log isn't off. */
export const isTracked = (build: Pick<Build, 'repo' | 'log'>) => !!build.repo && build.log !== 'off'

/** Put the whole log together from what the fetchers returned. */
export function assembleLog(builds: Build[], snapshots: RepoSnapshot[], highlights: Highlight[]): BuildLog {
  const byRepo = new Map(snapshots.map((s) => [s.repo, s]))
  // Only tracked builds appear: one without a repo (or with its log off) would
  // only ever say "nothing logged", which reads as abandoned, and its
  // highlights would have no chip or name in the feed.
  const tracked = builds.filter(isTracked)
  const slugs = tracked.map((b) => b.slug)

  const automatic = tracked.flatMap((build) => {
    const snapshot = byRepo.get(build.repo!)
    return snapshot ? entriesForBuild(build, snapshot) : []
  })
  const pinned = highlights.filter((h) => slugs.includes(h.build)).map(highlightEntry)
  const entries = sortEntries([...pinned, ...automatic], slugs)

  return {
    entries,
    activity: buildActivity(tracked, entries, Object.fromEntries(snapshots.map((s) => [s.repo, s.pushedAt]))),
    months: Object.fromEntries([...new Set(entries.map((e) => e.month))].map((m) => [m, monthLabel(m)])),
    recentFrom: recentFrom(entries),
  }
}

// ---------------------------------------------------------------------------
// Fetching

const GITHUB_API = 'https://api.github.com'
/** Matches the pages' ISR window; the fetch cache keeps the last good response per URL. */
const REVALIDATE = 3600

async function github<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN
  // Anonymous requests share a 60-an-hour limit per IP: fine for `next dev`, not for a deployment.
  if (!token && process.env.NODE_ENV === 'production') throw new Error('GITHUB_TOKEN is not set')
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'n8builds-web',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: REVALIDATE, tags: ['build-log'] },
    signal: AbortSignal.timeout(10_000),
  })
  // Only 200s enter Next's fetch cache, so an error never replaces good data.
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`)
  return res.json() as Promise<T>
}

type GitHubRepo = { pushed_at: string | null }
type GitHubRelease = { tag_name: string; name: string | null; published_at: string | null; html_url: string; draft: boolean; prerelease: boolean }
type GitHubCommit = {
  sha: string
  html_url: string
  parents: unknown[]
  author: { login: string } | null
  commit: { message: string; author: { name: string; date: string } | null; committer: { date: string } | null }
}

export function normalizeCommit(c: GitHubCommit): SnapshotCommit {
  return {
    sha: c.sha,
    message: c.commit.message.split('\n')[0],
    date: c.commit.committer?.date ?? c.commit.author?.date ?? '',
    author: c.author?.login ?? c.commit.author?.name ?? null,
    parents: c.parents.length,
    url: c.html_url,
  }
}

export function normalizeRelease(r: GitHubRelease): SnapshotRelease {
  return {
    tag: r.tag_name,
    name: r.name || r.tag_name,
    publishedAt: r.published_at ?? '',
    url: r.html_url,
    draft: r.draft,
    prerelease: r.prerelease,
  }
}

// How far back the log reads each repo's commits. The feed opens on 12 months
// (`recentFrom`), so every repo is read back to the start of that window: the
// newest page always, then older pages while they are full and still inside it.
export const COMMIT_PAGE_SIZE = 100
/** Never more than this many pages (1,000 commits) a repo, however busy it is. */
export const MAX_COMMIT_PAGES = 10
export const HISTORY_MONTHS = 12

/**
 * The oldest commit date the log needs: midnight UTC on the first day of the
 * month `months - 1` before `now`'s. Los Angeles is behind UTC, so this is
 * never later than the window's first day there.
 */
export function historyCutoff(now: Date = new Date(), months = HISTORY_MONTHS): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1)).toISOString()
}

/**
 * A repo's commits, newest first, read page by page: page 1 always (so a quiet
 * repo keeps its older history, as before), then the next page only while the
 * last one was full and its oldest commit is still inside the window, up to
 * `maxPages`. Commits are deduplicated by sha, since a commit landing between
 * two page reads shifts the pages by one.
 */
export async function collectCommits(
  fetchPage: (page: number) => Promise<SnapshotCommit[]>,
  cutoff: string,
  { pageSize = COMMIT_PAGE_SIZE, maxPages = MAX_COMMIT_PAGES } = {},
): Promise<{ commits: SnapshotCommit[]; pages: number; truncated: boolean }> {
  const seen = new Set<string>()
  const commits: SnapshotCommit[] = []
  let pages = 0
  let more = true
  while (more && pages < maxPages) {
    const batch = await fetchPage(++pages)
    for (const c of batch) {
      if (seen.has(c.sha)) continue
      seen.add(c.sha)
      commits.push(c)
    }
    // As instants, not strings: GitHub's dates have no milliseconds, the cutoff does.
    const oldest = Math.min(...batch.map((c) => Date.parse(c.date)).filter((t) => !Number.isNaN(t)))
    more = batch.length === pageSize && Number.isFinite(oldest) && oldest >= Date.parse(cutoff)
  }
  // Still more inside the window when the cap stopped it.
  return { commits, pages, truncated: more }
}

/**
 * A repo's releases and its owner's commits on the default branch, back to the
 * start of the log's window (see `collectCommits`). Asking for the owner's
 * commits (not every commit) keeps bot-heavy repos visible: Portfolio Rank's
 * newest 100 commits are all daily bot syncs.
 *
 * Requests per hourly refresh: two (the repo and its releases) plus one per
 * page of commits. Each URL is its own entry in Next's fetch cache.
 */
async function fetchRepoSnapshot(repo: string): Promise<RepoSnapshot> {
  const owner = repo.split('/')[0]
  const [info, releases, history] = await Promise.all([
    github<GitHubRepo>(`/repos/${repo}`),
    github<GitHubRelease[]>(`/repos/${repo}/releases?per_page=100`),
    collectCommits(async (page) => {
      // Page 1 keeps its old URL, so its cache entry carries over.
      const query = `per_page=${COMMIT_PAGE_SIZE}&author=${owner}${page > 1 ? `&page=${page}` : ''}`
      const batch = await github<GitHubCommit[]>(`/repos/${repo}/commits?${query}`)
      return batch.map(normalizeCommit)
    }, historyCutoff()),
  ])
  if (history.truncated) logger.warn(`[build-log] ${repo}: stopped at ${MAX_COMMIT_PAGES} pages of commits, short of the log's window`)
  return {
    repo,
    pushedAt: info.pushed_at,
    releases: releases.map(normalizeRelease).filter((r) => r.publishedAt),
    commits: history.commits.filter((c) => c.date),
  }
}

const HIGHLIGHTS_QUERY = `*[_type == "logEntry" && defined(date) && defined(build) && defined(title)] | order(date desc)[0...200]{
  "id": _id, date, build, title, note, link,
  "kind": coalesce(kind, "shipped"),
  "imageUrl": image.asset->url,
  "imageAlt": image.alt
}`

/** Hand-written highlights. Optional: none, or Sanity being down, is an empty list. */
async function fetchHighlights(): Promise<Highlight[]> {
  try {
    // Imported here so the pure helpers above load without Sanity's env.
    const { sanity } = await import('@/lib/sanity')
    return await sanity.fetch<Highlight[]>(HIGHLIGHTS_QUERY)
  } catch (error) {
    logger.warn('[build-log] Sanity highlights unavailable:', error)
    return []
  }
}

type Fixture = { capturedAt: string; snapshots: RepoSnapshot[]; highlights: Highlight[] }

const loadFixture = async (): Promise<Fixture> =>
  (await import('@/tests/fixtures/build-log-github.json')).default as Fixture

/** The fetchers, swapped for the recorded fixture under BUILD_LOG_FIXTURE=1. */
function fetchers() {
  if (process.env.BUILD_LOG_FIXTURE === '1') {
    return {
      snapshot: async (repo: string) => {
        const found = (await loadFixture()).snapshots.find((s) => s.repo === repo)
        if (!found) throw new Error(`No fixture for ${repo}`)
        return found
      },
      highlights: async () => (await loadFixture()).highlights,
      now: async () => new Date((await loadFixture()).capturedAt),
    }
  }
  return { snapshot: fetchRepoSnapshot, highlights: fetchHighlights, now: async () => new Date() }
}

/**
 * The whole log. Never fails a build: a repo GitHub can't serve is left out
 * (with Next's fetch cache, that only happens when there is no earlier good
 * response). When every repo fails on a revalidation (GitHub down, the token
 * revoked), it throws, so ISR keeps serving the last good page.
 */
export const getBuildLog = cache(async (): Promise<BuildLog & { asOf: string }> => {
  const source = fetchers()
  const tracked = allBuilds.filter(isTracked)
  const [results, highlights] = await Promise.all([
    Promise.allSettled(tracked.map((b) => source.snapshot(b.repo!))),
    source.highlights(),
  ])

  const snapshots: RepoSnapshot[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') snapshots.push(result.value)
    else logger.warn(`[build-log] ${tracked[i].repo} unavailable:`, result.reason)
  })
  if (tracked.length && !snapshots.length && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('Build log: GitHub returned nothing for any tracked repo')
  }
  // "Now" for anything that reads the calendar (the homepage strip's "this
  // month"): the fixture's capture time under BUILD_LOG_FIXTURE=1, so tests
  // don't drift as the months pass.
  return { ...assembleLog(allBuilds, snapshots, highlights), asOf: (await source.now()).toISOString() }
})

/** One build's newest entries, for its page's "Recent activity". */
export async function getRecentActivity(slug: string, limit = 5): Promise<LogEntry[]> {
  const { entries } = await getBuildLog()
  return entries
    .filter((e) => e.build === slug)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}
