import { afterEach, describe, expect, it, vi } from 'vitest'
import fixture from '@/tests/fixtures/build-log-github.json'
import { builds, getBuild, hiddenBuilds, type Build } from '@/data/builds'
import {
  assembleLog,
  buildActivity,
  classifyCommit,
  cleanTitle,
  dayKey,
  entriesForBuild,
  getBuildLog,
  getRecentActivity,
  highlightEntry,
  monthYearLabel,
  normalizeCommit,
  recentFrom,
  sortEntries,
  type Highlight,
  type LogEntry,
  type RepoSnapshot,
  type SnapshotCommit,
} from '@/lib/build-log'

/**
 * The build log's rules, against commits and releases recorded from the real
 * repos (tests/fixtures/build-log-github.json, captured by
 * scripts/build-log-fixture.mjs).
 */

const snapshots = fixture.snapshots as RepoSnapshot[]
const highlights = fixture.highlights as Highlight[]
const snapshot = (repo: string) => snapshots.find((s) => s.repo === `n8watkins/${repo}`)!
const build = (slug: string) => getBuild(slug)!

/** A commit from the fixture, by its exact message, so every case is a real one. */
function real(message: string): SnapshotCommit {
  for (const s of snapshots) {
    const found = s.commits.find((c) => c.message === message)
    if (found) return found
  }
  throw new Error(`Not in the fixture: ${message}`)
}

const commit = (message: string, date = '2026-08-01T18:00:00Z', extra: Partial<SnapshotCommit> = {}): SnapshotCommit => ({
  sha: `${message.length}${date}`,
  message,
  date,
  author: 'n8watkins',
  parents: 1,
  url: `https://github.com/n8watkins/example/commit/${message.length}`,
  ...extra,
})

const repoOf = (commits: SnapshotCommit[], releases: RepoSnapshot['releases'] = []): RepoSnapshot => ({
  repo: 'n8watkins/example',
  pushedAt: null,
  releases,
  commits,
})

const testBuild = (extra: Partial<Build> = {}) =>
  ({ slug: 'example', log: undefined, github: 'https://github.com/n8watkins/example', ...extra }) as Build

describe('the commit filter', () => {
  it.each([
    ['chore: sync portfolios from upstream', 'bot'],
    ['chore(deps-dev): bump typescript', 'bot'],
    ['Merge pull request #7 from n8watkins/dependabot/github_actions/safe-updates-f68f065c7c', 'merge'],
    ["Merge branch 'main' into dependabot/github_actions/safe-updates-f68f065c7c", 'merge'],
  ])('drops bot and merge commits: %s', (message, reason) => {
    expect(classifyCommit(real(message))).toEqual({ kind: 'drop', reason })
  })

  it.each([
    'docs: HANDOFF — PSI key resolved (new key set + verified)',
    'docs: consolidate authoritative product contracts',
    'chore: redeploy to pick up the new PSI_API_KEY',
    'test(tube-vault): add helper unit tests; harden yt-dlp arg passing',
    'ci: enforce the full extension quality gate',
    'refactor: remove orphaned watch-time/engagement dead code (post-decoupling)',
    'build(tube-vault): sync helper package.json so ping version stays fresh',
    'release: prepare unlisted 1.0.0 package assets',
    'README: point the writeup at the N8 Notions post; drop the in-repo draft',
    'Fix code-review findings: drop dead TopFive, FAQ accordion a11y',
    'fix(review): stuck-Analyzing on host miss, broken channel-tag lookup, search dead-end',
    'Fix the signed-in e2e and harness clock flakes (#69)',
    'Add a Google user data section to the privacy policy (#48)',
    'Add .gitignore and MIT LICENSE for GitHub',
    'Upgrade Stripe to 23 and pin the Stripe API version (#58)',
    'Ignore local ops metadata',
    'judge: apply adversarial-review fixes to R2 grading',
    'mobile polish: declutter header + icon-only socials on small screens',
  ])('drops upkeep: %s', (message) => {
    expect(classifyCommit(real(message)).kind).toBe('drop')
  })

  it.each([
    ['feat: surface actionable Gemini API failures', 'Surface actionable Gemini API failures', 3],
    ['perf(options): virtualize the expanded channel video list', 'Virtualize the expanded channel video list', 2],
    ['fix(tube-vault): accept youtu.be short links in URL validation', 'Accept youtu.be short links in URL validation', 1],
    ['Add one-command adaptive setup script', 'Add one-command adaptive setup script', 3],
    ['Lower first-sentence latency: small first chunk + prefetch pipeline', 'Lower first-sentence latency: small first chunk + prefetch pipeline', 2],
    ['Restyle and split the dashboard (W4-A) (#67)', 'Restyle and split the dashboard', 2],
    [
      'Scheduled activities: see, open, move and remove the Google Calendar events Solara created (#55)',
      'Scheduled activities: see, open, move and remove the Google Calendar events Solara created',
      3,
    ],
    [
      'feat: stop imposing an AI verdict — TL;DW is less opinionated, summaries only',
      'Stop imposing an AI verdict - TL;DW is less opinionated, summaries only',
      3,
    ],
  ])('keeps features, fixes and plain-sentence changes: %s', (message, title, score) => {
    expect(classifyCommit(real(message))).toEqual({ kind: 'change', title, score })
  })

  it('reads version-bump commits as releases', () => {
    expect(classifyCommit(real('build(tube-vault): v0.3.80'))).toEqual({ kind: 'version', version: 'v0.3.80' })
    expect(classifyCommit(real('Bump to v0.4.0; show version in popup header'))).toEqual({ kind: 'version', version: 'v0.4.0' })
    expect(classifyCommit(real('v1.0.6: fix Alt+Shift+R tab-isolation bug, add Stop shortcut, volume rocker'))).toEqual({
      kind: 'version',
      version: 'v1.0.6',
      notes: 'Fix Alt+Shift+R tab-isolation bug, add Stop shortcut, volume rocker',
    })
    // The release-kit standard's release commit.
    expect(classifyCommit(commit('chore(release): v1.2.0'))).toEqual({ kind: 'version', version: 'v1.2.0' })
    expect(classifyCommit(real('v1.0.1: fix all code review findings'))).toEqual({ kind: 'version', version: 'v1.0.1', notes: undefined })
  })

  it('treats any author ending in [bot] as a bot', () => {
    expect(classifyCommit(commit('feat: add a thing people would see', undefined, { author: 'renovate[bot]' })).kind).toBe('drop')
  })
})

describe('cleanTitle', () => {
  it('capitalises, drops the trailing period and never shows an em dash', () => {
    expect(cleanTitle('launch tray windowless — no CMD flash.')).toBe('Launch tray windowless - no CMD flash')
  })

  it('cuts long messages at a word boundary', () => {
    const title = cleanTitle(`add ${'a very long change description '.repeat(6)}`)
    expect(title.length).toBeLessThanOrEqual(110)
    expect(title).toMatch(/\w…$/)
  })
})

describe('entries for a build', () => {
  it('uses Los Angeles days, so an evening commit stays on its day', () => {
    expect(dayKey('2026-10-24T05:57:03Z')).toBe('2026-10-23')
    expect(monthYearLabel('2026-11-01T06:00:00Z')).toBe('Oct 2026')
  })

  it("collapses a day's commits into its strongest change, plus a count", () => {
    const entries = entriesForBuild(build('solara'), snapshot('solara'))
    const day = entries.filter((e) => e.day === '2026-10-23')
    expect(day).toHaveLength(1)
    expect(day[0]).toMatchObject({
      kind: 'change',
      title: 'Scheduled activities: see, open, move and remove the Google Calendar events Solara created',
      more: 13,
      dayLabel: 'Oct 23',
    })
    // One entry per day, newest first.
    expect(new Set(entries.map((e) => e.day)).size).toBe(entries.length)
    expect(entries.map((e) => e.date)).toEqual([...entries.map((e) => e.date)].sort().reverse())
  })

  it('breaks a tie between equally strong changes in favour of the newest', () => {
    const [entry] = entriesForBuild(testBuild(), repoOf([commit('feat: add the newer thing', '2026-08-01T20:00:00Z'), commit('feat: add the older thing', '2026-08-01T16:00:00Z')]))
    expect(entry).toMatchObject({ title: 'Add the newer thing', more: 1 })
  })

  it("gives a bot-heavy repo its owner's changes and nothing from the bot", () => {
    const entries = entriesForBuild(build('portfolio-rank'), snapshot('portfolio-rank'))
    expect(snapshot('portfolio-rank').commits.filter((c) => c.author === 'github-actions[bot]').length).toBeGreaterThan(5)
    expect(entries.length).toBeGreaterThan(0)
    // The bot synced every day in October; none of that is news.
    expect(entries.filter((e) => e.month === '2026-10')).toEqual([])
  })

  it('folds version-bump commits into one release entry per day, detailed by the strongest change', () => {
    const entries = entriesForBuild(build('tubevault'), snapshot('tube-vault'))
    expect(entries.every((e) => e.kind === 'release' || e.kind === 'change')).toBe(true)
    expect(entries.find((e) => e.day === '2026-06-06')).toMatchObject({
      kind: 'release',
      title: 'Shipped v0.3.80',
      detail: 'Cross-platform native-host setup (macOS/Linux), no hardcoded user',
      more: 2,
    })
    expect(entries.some((e) => /^Shipped v0\.3\.79$/.test(e.title))).toBe(false)
  })

  it('details a release by its own notes when the version commit has them', () => {
    const piper = entriesForBuild(build('piper-tts'), snapshot('piper-tts'))
    expect(piper.find((e) => e.title === 'Shipped v1.0.6')).toMatchObject({
      kind: 'release',
      detail: 'Fix Alt+Shift+R tab-isolation bug, add Stop shortcut, volume rocker',
    })
  })

  it('shows only releases for a releases-only build, newest version per day', () => {
    const scribe = build('scribe')
    expect(scribe.log).toBe('releases')
    const entries = entriesForBuild(scribe, snapshot('scribe'))
    expect(entries.every((e) => e.kind === 'release' && /^Shipped v\d+\.\d+\.\d+$/.test(e.title) && !e.detail)).toBe(true)
    expect(entries.find((e) => e.day === '2026-06-14')?.title).toBe('Shipped v0.5.22')
    expect(entries.find((e) => e.day === '2026-06-13')?.title).toBe('Shipped v0.5.7')
    expect(entries[0]).toMatchObject({ title: 'Shipped v0.8.0', url: 'https://github.com/n8watkins/scribe/releases/tag/v0.8.0' })
  })

  it('counts a GitHub release and its release commit once, and skips drafts and prereleases', () => {
    const release = (tag: string, extra = {}) => ({
      tag,
      name: tag,
      publishedAt: '2026-08-01T19:00:00Z',
      url: `https://github.com/n8watkins/example/releases/tag/${tag}`,
      draft: false,
      prerelease: false,
      ...extra,
    })
    const entries = entriesForBuild(
      testBuild(),
      repoOf(
        [commit('chore(release): v1.2.0', '2026-08-01T18:00:00Z'), commit('feat: add dark mode', '2026-08-01T17:00:00Z')],
        [release('v1.2.0'), release('v1.3.0-beta.1', { prerelease: true }), release('v1.3.0', { draft: true })],
      ),
    )
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      kind: 'release',
      title: 'Shipped v1.2.0',
      detail: 'Add dark mode',
      more: 0,
      url: 'https://github.com/n8watkins/example/releases/tag/v1.2.0',
    })
  })

  it('drops internal work: sprints, audits, batches, phase codes and number-heavy logs', () => {
    for (const message of [
      'feat: tag type + tag storage keys for the feature sprint',
      'Capture batch complete: 1692 live, 44 dead, 43 error (full 1779 coverage)',
      'fix: apply pre-submission hardenings from the compliance audit',
      'V2 P7a: client-side ICS export',
      'Wire P7b live calendar-feed client side',
    ]) {
      expect(classifyCommit({ message, author: 'n8watkins', parents: 1 }), message).toMatchObject({ kind: 'drop', reason: 'internal' })
    }
    // Real features still pass, including ones with a single number.
    expect(classifyCommit({ message: 'feat: add a 30-day history', author: 'n8watkins', parents: 1 })).toMatchObject({ kind: 'change' })
    expect(classifyCommit({ message: 'Scheduled activities: see, open and move calendar events', author: 'n8watkins', parents: 1 })).toMatchObject({ kind: 'change' })
  })

  it('hides entries the owner lists in logHide', () => {
    const all = entriesForBuild(build('tldw'), snapshot('tl-dw'))
    const target = all.find((e) => e.kind === 'change')!
    const hiddenTitle = target.title.slice(0, 20)
    const filtered = entriesForBuild({ ...build('tldw'), logHide: [hiddenTitle.toUpperCase()] }, snapshot('tl-dw'))
    expect(filtered.some((e) => e.title.includes(hiddenTitle))).toBe(false)
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('never links into a repo the build has no public GitHub link for', () => {
    const privateRepo = { ...build('solara'), github: undefined }
    expect(entriesForBuild(privateRepo, snapshot('solara')).every((e) => e.url === undefined)).toBe(true)
    // Solara's repo went public, so its entries now link into it.
    expect(entriesForBuild(build('solara'), snapshot('solara')).some((e) => e.url?.startsWith('https://github.com/n8watkins/solara/'))).toBe(true)
    expect(entriesForBuild(build('tldw'), snapshot('tl-dw')).every((e) => e.url?.startsWith('https://github.com/n8watkins/tl-dw/commit/'))).toBe(true)
  })

  it("shows nothing for a build whose log is 'off'", () => {
    expect(entriesForBuild(testBuild({ log: 'off' }), snapshot('tl-dw'))).toEqual([])
  })
})

describe('merging, sorting and the builds index', () => {
  const log = assembleLog(builds, snapshots, highlights)

  it('tracks the visible builds with a repo, and none of the hidden ones', () => {
    const tracked = builds.filter((b) => b.repo)
    expect(tracked.map((b) => b.slug)).toEqual(['piper-tts', 'tldw', 'tubevault', 'scribe', 'openping', 'solara', 'portfolio-rank'])
    expect(tracked.every((b) => /^n8watkins\/[\w-]+$/.test(b.repo!))).toBe(true)
    expect(hiddenBuilds.every((b) => !b.repo)).toBe(true)
    expect(new Set(log.entries.map((e) => e.build))).toEqual(new Set(tracked.map((b) => b.slug)))
  })

  it('leaves untracked builds out of the index, rather than showing them as empty', () => {
    // n8builds itself is a build page, not a tracked repo.
    expect(build('n8builds').repo).toBeUndefined()
    expect(log.activity.map((a) => a.slug)).not.toContain('n8builds')
    const off = { ...build('tldw'), log: 'off' as const }
    const without = assembleLog([...builds.filter((b) => b.slug !== 'tldw'), off], snapshots, highlights)
    expect(without.activity.map((a) => a.slug)).not.toContain('tldw')
    // Nor its highlights: the feed has no chip or name for it.
    expect(without.entries.some((e) => e.build === 'tldw')).toBe(false)
  })

  it('pins highlights above the automatic entries of their month', () => {
    const july = log.entries.filter((e) => e.month === '2026-07')
    expect(july[0]).toMatchObject({ kind: 'highlight', build: 'tldw', title: 'TL;DW 1.0 is packaged for the Chrome Web Store' })
    expect(july.slice(1).every((e) => e.kind !== 'highlight')).toBe(true)

    const early = highlightEntry({ ...highlights[0], id: 'early', date: '2026-07-01' })
    const sorted = sortEntries([...log.entries, early])
    // Even an early-July highlight sits above every automatic July entry.
    expect(sorted.filter((e) => e.month === '2026-07').slice(0, 2).map((e) => e.id)).toEqual(['highlight:fixture-highlight-tldw', 'highlight:early'])
  })

  it('orders the feed by month, newest first', () => {
    const months = log.entries.map((e) => e.month)
    expect(months).toEqual([...months].sort().reverse())
    expect(log.months['2026-10']).toBe('October 2026')
  })

  it('drops highlights for builds that are not on the site', () => {
    const merged = assembleLog(builds, snapshots, [{ ...highlights[0], id: 'hidden', build: 'vibelog' }])
    expect(merged.entries.some((e) => e.kind === 'highlight')).toBe(false)
  })

  it('works with no highlights at all', () => {
    const plain = assembleLog(builds, snapshots, [])
    expect(plain.entries.length).toBe(log.entries.length - highlights.length)
    expect(plain.entries.some((e) => e.kind === 'highlight')).toBe(false)
  })

  it('sorts builds by their latest activity and labels it as a month, never "ago"', () => {
    expect(log.activity.map((a) => a.slug)).toEqual(['solara', 'tldw', 'openping', 'scribe', 'portfolio-rank', 'tubevault', 'piper-tts'])
    expect(log.activity.map((a) => a.lastShippedLabel)).toEqual(['Oct 2026', 'Jul 2026', 'Jul 2026', 'Jul 2026', 'Jun 2026', 'Jun 2026', 'Jun 2026'])
    expect(log.activity.every((a) => a.latest.length === 2)).toBe(true)
  })

  it('sorts a build with no entries by its last push, after the active ones', () => {
    const quiet = { ...build('piper-tts'), slug: 'quiet', repo: 'n8watkins/quiet' }
    const rows = buildActivity([quiet, ...builds.filter((b) => b.repo)], log.entries, { 'n8watkins/quiet': '2026-01-01T00:00:00Z' })
    expect(rows.at(-1)).toMatchObject({ slug: 'quiet', lastShipped: null, lastShippedLabel: null, latest: [] })
  })

  it('opens the feed on the 12 months up to the newest entry', () => {
    const at = (month: string) => ({ month }) as LogEntry
    expect(recentFrom([at('2026-10'), at('2024-01')])).toBe('2025-11')
    expect(recentFrom([at('2026-01')])).toBe('2025-02')
    expect(recentFrom([])).toBeNull()
    expect(log.recentFrom).toBe('2025-11')
  })
})

describe('normalizing the GitHub API', () => {
  it('keeps the header line, the committer date and the login', () => {
    expect(
      normalizeCommit({
        sha: 'abc',
        html_url: 'https://github.com/n8watkins/tl-dw/commit/abc',
        parents: [{}],
        author: { login: 'n8watkins' },
        commit: {
          message: 'feat: cache prompt-aware summary variants\n\nLonger body.',
          author: { name: 'Nathan Watkins', date: '2026-07-19T10:00:00Z' },
          committer: { date: '2026-07-20T08:00:00Z' },
        },
      }),
    ).toEqual({
      sha: 'abc',
      message: 'feat: cache prompt-aware summary variants',
      date: '2026-07-20T08:00:00Z',
      author: 'n8watkins',
      parents: 1,
      url: 'https://github.com/n8watkins/tl-dw/commit/abc',
    })
  })
})

describe('getBuildLog', () => {
  afterEach(() => vi.unstubAllGlobals())

  const offline = () => {
    vi.stubEnv('BUILD_LOG_FIXTURE', '')
    vi.stubEnv('GITHUB_TOKEN', 'test-token')
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    const fetch = vi.fn(async () => new Response('rate limited', { status: 403 }))
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    return fetch
  }

  it('reads the fixture, and never GitHub, under BUILD_LOG_FIXTURE=1', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    vi.stubEnv('BUILD_LOG_FIXTURE', '1')
    const log = await getBuildLog()
    expect(fetch).not.toHaveBeenCalled()
    expect(log.entries.length).toBeGreaterThan(20)
    expect(log.entries.some((e) => e.kind === 'highlight')).toBe(true)
    expect((await getRecentActivity('scribe')).map((e) => e.title)).toEqual([
      'Shipped v0.8.0',
      'Shipped v0.7.0',
      'Shipped v0.6.0',
      'Shipped v0.5.22',
      'Shipped v0.5.7',
    ])
  })

  it('sends the token and asks for the owner’s commits', async () => {
    const fetch = offline()
    await expect(getBuildLog()).rejects.toThrow()
    const calls = fetch.mock.calls as unknown as [string, RequestInit][]
    expect(calls.map(([url]) => url)).toContain('https://api.github.com/repos/n8watkins/portfolio-rank/commits?per_page=100&author=n8watkins')
    expect(new Headers(calls[0][1].headers).get('Authorization')).toBe('Bearer test-token')
  })

  it('still builds the page when GitHub is down, with an empty log', async () => {
    offline()
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    const log = await getBuildLog()
    expect(log.entries).toEqual([])
    expect(log.activity).toHaveLength(builds.filter((b) => b.repo).length)
  })

  it('throws on a revalidation where GitHub serves nothing, so ISR keeps the last good page', async () => {
    offline()
    await expect(getBuildLog()).rejects.toThrow(/GitHub returned nothing/)
  })

  it('renders the repos it has when only some fail', async () => {
    offline()
    const real = (path: string) => {
      const s = snapshot('scribe')
      if (path.endsWith('/repos/n8watkins/scribe')) return { pushed_at: s.pushedAt }
      if (path.includes('/scribe/releases')) return s.releases.map((r) => ({ tag_name: r.tag, name: r.name, published_at: r.publishedAt, html_url: r.url, draft: r.draft, prerelease: r.prerelease }))
      if (path.includes('/scribe/commits')) return []
      return null
    }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const body = real(url)
      return body ? Response.json(body) : new Response('nope', { status: 500 })
    }))
    const log = await getBuildLog()
    expect(new Set(log.entries.map((e) => e.build))).toEqual(new Set(['scribe']))
  })

  it('refuses anonymous GitHub requests in production', async () => {
    const fetch = offline()
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('NODE_ENV', 'production')
    await expect(getBuildLog()).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
