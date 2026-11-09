// The Playwright jobs ci.yml runs for each tier (scripts/e2e-matrix.mjs).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MATRIX as matrix, buildImporters, explain, globToRegExp, lighthouseFor, lighthouseOutput, loadAreas, matchesAny, planFor, selectFor, tierFor } from '@/scripts/e2e-matrix.mjs'

type Job = (typeof matrix)['full'][number]
const PROJECTS = ['api', 'chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari']

/** Every project's jobs, shard by shard, so a missing or doubled shard shows. */
const shardsOf = (jobs: Job[]) =>
  Object.fromEntries(PROJECTS.map((p) => [p, jobs.filter((j) => j.project === p).map((j) => j.shard || 'all')]))

describe('the E2E tiers', () => {
  it('runs everything when the full input is on, whatever started the run', () => {
    for (const event of ['workflow_dispatch', 'schedule', 'push', 'pull_request']) expect(tierFor(event, 'true')).toBe('full')
  })

  it('runs the pull request tier on pull requests and when "full" is unticked', () => {
    expect(tierFor('pull_request', '')).toBe('pr')
    expect(tierFor('workflow_dispatch', 'false')).toBe('pr')
  })

  it('runs the smoke tier on a push to main', () => {
    expect(tierFor('push', '')).toBe('smoke')
  })

  it('gives every tier at least one job (an empty matrix fails the workflow)', () => {
    for (const [tier, jobs] of Object.entries(matrix)) expect(jobs.length, tier).toBeGreaterThan(0)
  })

  it('runs every project in full, each shard once, with no filter', () => {
    expect(shardsOf(matrix.full)).toEqual({
      api: ['all'],
      chromium: ['all'],
      firefox: ['all'],
      webkit: ['1/3', '2/3', '3/3'],
      'mobile-chrome': ['all'],
      'mobile-safari': ['1/3', '2/3', '3/3'],
    })
    expect(matrix.full.every((j) => j.grep === '')).toBe(true)
  })

  it('runs the API and Chromium whole on a pull request, and only @cross-browser on the other browsers', () => {
    for (const job of matrix.pr) expect(job.grep, job.name).toBe(['api', 'chromium'].includes(job.project) ? '' : '@cross-browser')
    const shards = shardsOf(matrix.pr)
    for (const project of PROJECTS) {
      const count = shards[project].length
      expect(shards[project], project).toEqual(count === 1 ? ['all'] : Array.from({ length: count }, (_, i) => `${i + 1}/${count}`))
    }
  })

  it('runs only the @smoke tests on Chromium after a push', () => {
    expect(matrix.smoke.map((j) => [j.project, j.grep, j.shard])).toEqual([['chromium', '@smoke', '']])
  })

  it('gives every job a distinct name and an id fit for an artifact name', () => {
    for (const jobs of Object.values(matrix)) {
      expect(new Set(jobs.map((j) => j.name)).size).toBe(jobs.length)
      expect(new Set(jobs.map((j) => j.id)).size).toBe(jobs.length)
      for (const job of jobs) expect(job.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('prints the tier and the matrix for $GITHUB_OUTPUT, and ci.yml reads them', () => {
    const out = execFileSync('node', ['scripts/e2e-matrix.mjs', 'push', ''], { encoding: 'utf8' }).trim().split('\n')
    expect(out[0]).toBe('tier=smoke')
    expect(JSON.parse(out[1].replace(/^matrix=/, ''))).toEqual({ include: matrix.smoke })
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(ci).toContain('node scripts/e2e-matrix.mjs "$EVENT" "$FULL"')
    expect(ci).toContain('matrix: ${{ fromJSON(needs.changes.outputs.e2e) }}')
    // "Run workflow", the release train and the nightly call run in full unless told otherwise.
    for (const trigger of ['workflow_dispatch', 'workflow_call']) {
      expect(ci).toMatch(new RegExp(`${trigger}:\\n    inputs:\\n      full:\\n.*\\n        type: boolean\\n        default: true\\n`))
    }
  })
})

// ---------------------------------------------------------------------------
// The affected tier: tests/e2e/areas.json and the selection on top of it.

const areas = loadAreas()
const importers = buildImporters()
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean)
const specFiles = tracked.filter((f) => f.startsWith('tests/e2e/') && f.endsWith('.spec.ts'))
const groupNames = Object.keys(areas.groups)
const inGroup = (f: string) => groupNames.filter((g) => matchesAny(f, areas.groups[g].sources))
const always = areas.always.flatMap((g) => areas.groups[g].specs)
const specsOf = (...groups: string[]) => [...new Set(groups.flatMap((g) => areas.groups[g].specs))].sort()

describe('the area map (tests/e2e/areas.json)', () => {
  it('puts every spec file in exactly one group, and lists no spec that is gone', () => {
    const owners = (spec: string) => groupNames.filter((g) => areas.groups[g].specs.includes(spec))
    for (const spec of specFiles) expect(owners(spec), spec).toHaveLength(1)
    for (const g of groupNames) for (const spec of areas.groups[g].specs) expect(specFiles, `${g}: ${spec}`).toContain(spec)
    for (const g of areas.always) expect(groupNames).toContain(g)
  })

  it('knows every file in the repo, so no change falls through to "run everything" by accident', () => {
    const unknown = tracked.filter((f) => {
      const r = explain(f, areas, importers)
      return r.kind === 'full' && r.why !== 'a shared file'
    })
    expect(unknown, 'add these to a group, shared, none or inherit').toEqual([])
  })

  it('gives every component folder and section, and every route, an area of its own', () => {
    const owned = tracked.filter((f) => (f.startsWith('components/') || f.startsWith('app/')) && !matchesAny(f, areas.inherit))
    const orphans = owned.filter((f) => inGroup(f).length === 0 && !matchesAny(f, areas.shared))
    expect(orphans, 'map these in a group (or, for a building block, inherit)').toEqual([])
  })

  it('has no stale entry: every glob matches a file', () => {
    const globs = [...areas.shared, ...areas.none, ...areas.inherit, ...groupNames.flatMap((g) => areas.groups[g].sources)]
    const stale = globs.filter((glob) => !tracked.some((f) => matchesAny(f, [glob])))
    expect(stale).toEqual([])
  })

  it('reads imports: path aliases, relative paths, dynamic imports and helpers', () => {
    expect([...(importers.get('components/sections/Hero.tsx') ?? [])]).toContain('components/HomePage.tsx')
    expect([...(importers.get('tests/e2e/section-rail.ts') ?? [])]).toContain('tests/e2e/lab-section-nav.spec.ts')
    expect([...(importers.get('app/globals.css') ?? [])]).toContain('app/layout.tsx')
  })
})

describe('choosing the specs for a pull request', () => {
  const select = (...changed: string[]) => selectFor(changed, areas, importers)

  it('runs everything for a shared file, and for a path the map does not know', () => {
    for (const f of ['app/layout.tsx', 'app/globals.css', 'next.config.mjs', 'package-lock.json', 'playwright.config.ts', 'tests/e2e-env.ts', '.github/workflows/ci.yml'])
      expect(select('components/sections/Hero.tsx', f).full, f).toBe(true)
    expect(select('brand-new-folder/thing.ts').full).toBe(true)
    expect(select('app/brand-new-route/page.tsx').full).toBe(true)
  })

  it('runs no area for unit tests, scripts, docs and the Worker', () => {
    expect(select('tests/unit/seo.test.ts', 'scripts/lighthouse.mjs', 'docs/DECISIONS.md', 'worker/index.js')).toMatchObject({ full: false, specs: [] })
  })

  it("runs a section's own area, the areas that contain it, and the always-on group", () => {
    expect(select('components/sections/HeroGrid.tsx').specs).toEqual(specsOf('hero', 'home', ...areas.always))
    expect(select('components/log/LogFeed.tsx').specs).toEqual(specsOf('build-log', ...areas.always))
  })

  it('follows a building block to every area that imports it', () => {
    const { specs } = select('components/upcoming/JoinButton.tsx')
    expect(specs).toEqual(expect.arrayContaining(specsOf('upcoming', 'home')))
    expect(specs).not.toContain('tests/e2e/hero.spec.ts')
  })

  it('runs a changed spec, and the specs that use a changed helper', () => {
    expect(select('tests/e2e/hero.spec.ts').specs).toEqual([...new Set(['tests/e2e/hero.spec.ts', ...always])].sort())
    expect(select('tests/e2e/section-rail.ts').specs).toEqual(
      expect.arrayContaining(['tests/e2e/lab-section-nav.spec.ts', 'tests/e2e/loadout-section-nav.spec.ts', 'tests/e2e/home-loadout-nav.spec.ts']),
    )
  })

  it('runs nothing for a deleted building block (whatever imported it changed too)', () => {
    expect(select('lib/gone-for-good.ts')).toMatchObject({ full: false, specs: [] })
  })

  it('reads globs like the map means them', () => {
    expect(globToRegExp('components/sections/Hero*.tsx').test('components/sections/HeroGrid.tsx')).toBe(true)
    expect(globToRegExp('app/builds/[slug]/**').test('app/builds/[slug]/og.png/route.tsx')).toBe(true)
    expect(globToRegExp('app/**/og.png/**').test('app/builds/og.png/route.tsx')).toBe(true)
    expect(globToRegExp('**/*.md').test('README.md')).toBe(true)
    expect(globToRegExp('lib/*.ts').test('lib/email/send.ts')).toBe(false)
  })
})

describe('the affected tier', () => {
  const jobsFor = (...changed: string[]) => planFor('pull_request', '', changed)

  it('runs the pull request tier for a shared change and the affected tier otherwise', () => {
    expect(jobsFor('app/layout.tsx').tier).toBe('pr')
    expect(jobsFor('app/layout.tsx').jobs).toEqual(matrix.pr)
    expect(jobsFor('components/log/LogFeed.tsx').tier).toBe('affected')
    expect(planFor('pull_request', 'true', ['components/log/LogFeed.tsx']).tier).toBe('full')
    expect(planFor('pull_request', '', null).tier).toBe('pr')
    expect(planFor('push', '', ['components/log/LogFeed.tsx']).tier).toBe('smoke')
  })

  it('always runs @smoke on Chromium, even when no area changed', () => {
    const { jobs } = jobsFor('tests/unit/seo.test.ts')
    expect(jobs.map((j) => [j.project, j.grep, j.files])).toEqual([['chromium', '@smoke', '']])
  })

  it('runs @smoke and the selected files in one Chromium filter that names each file exactly', () => {
    const chromium = jobsFor('components/sections/HeroGrid.tsx').jobs.filter((j) => j.project === 'chromium')
    expect(chromium.length).toBeGreaterThan(0)
    const grep = new RegExp(chromium[0].grep)
    expect(grep.test('chromium hero.spec.ts the hero fits')).toBe(true)
    expect(grep.test('chromium navigation.spec.ts the menu @smoke')).toBe(true)
    expect(grep.test('chromium navigation.spec.ts the menu')).toBe(false)
    expect(grep.test('chromium superhero.spec.ts x')).toBe(false)
    expect(grep.test('api api/hero.spec.ts x')).toBe(false)
  })

  it('runs the API project only for selected API specs', () => {
    expect(jobsFor('components/sections/HeroGrid.tsx').jobs.some((j) => j.project === 'api')).toBe(false)
    const api = jobsFor('app/api/contact/route.ts').jobs.filter((j) => j.project === 'api')
    expect(api.map((j) => j.files)).toEqual(['tests/e2e/api/contact.spec.ts'])
  })

  it("runs the selected specs' @cross-browser tests on every other browser, and only specs that have some", () => {
    const { jobs } = jobsFor('components/log/LogFeed.tsx')
    const others = jobs.filter((j) => !['api', 'chromium'].includes(j.project))
    expect(new Set(others.map((j) => j.project))).toEqual(new Set(['firefox', 'webkit', 'mobile-chrome', 'mobile-safari']))
    for (const job of others) {
      expect(job.grep).toBe('@cross-browser')
      for (const file of job.files.split(' ')) expect(readFileSync(file, 'utf8')).toContain('@cross-browser')
    }
  })

  it('splits large selections into shards, each once', () => {
    const { jobs } = jobsFor('lib/logger.ts')
    for (const project of PROJECTS) {
      const shards = shardsOf(jobs)[project]
      if (shards.length > 1) expect(shards).toEqual(Array.from({ length: shards.length }, (_, i) => `${i + 1}/${shards.length}`))
    }
    expect(shardsOf(jobs).chromium.length).toBe(2)
  })

  it('gives every job a distinct name and an id fit for an artifact name', () => {
    for (const changed of [['components/log/LogFeed.tsx'], ['lib/logger.ts'], ['tests/unit/seo.test.ts']]) {
      const { jobs } = jobsFor(...changed)
      expect(new Set(jobs.map((j) => j.name)).size).toBe(jobs.length)
      expect(new Set(jobs.map((j) => j.id)).size).toBe(jobs.length)
      for (const job of jobs) expect(job.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('reads the changed files ci.yml lists, and the full-e2e label', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(ci).toContain('node scripts/e2e-matrix.mjs "$EVENT" "$FULL" "$RUNNER_TEMP/changed-files.txt"')
    expect(ci).toContain('echo "$files" > "$RUNNER_TEMP/changed-files.txt"')
    expect(ci).toContain("contains(github.event.pull_request.labels.*.name, 'full-e2e')")
    expect(ci).toContain('FILES: ${{ matrix.files }}')
    const label = readFileSync('.github/workflows/full-e2e.yml', 'utf8')
    expect(label).toContain("github.event.label.name == 'full-e2e'")
    expect(label).toContain('gh workflow run ci.yml')
  })
})

describe('Lighthouse on a pull request', () => {
  const pagesFor = (...changed: string[]) => lighthouseFor(changed, areas, importers).pages

  it('maps exactly the pages scripts/lighthouse.mjs audits, each to a route that exists', () => {
    const script = readFileSync('scripts/lighthouse.mjs', 'utf8')
    const audited = JSON.parse(script.match(/^const PAGES = (\[.*\])$/m)![1].replace(/'/g, '"'))
    expect(Object.keys(areas.lighthouse.pages)).toEqual(audited)
    for (const route of Object.values(areas.lighthouse.pages)) expect(tracked, route).toContain(route)
  })

  it('audits every page for a shared file, the audit itself, and a path the map does not know', () => {
    for (const f of ['app/layout.tsx', 'app/globals.css', 'next.config.mjs', 'package.json', 'package-lock.json', 'scripts/lighthouse.mjs', 'brand-new-folder/x.ts'])
      expect(pagesFor(f), f).toBe('all')
  })

  it('audits every page for what the layout renders on all of them', () => {
    expect(pagesFor('components/consent/ConsentLoader.tsx')).toBe('all')
    expect(pagesFor('components/layout/SiteFooter.tsx')).toBe('all')
  })

  it('audits only the pages whose route uses the change', () => {
    expect(pagesFor('components/log/LogFeed.tsx')).toEqual(['/builds'])
    expect(pagesFor('components/sections/HeroGrid.tsx')).toEqual(['/'])
    expect(pagesFor('components/builds/BuildSidebar.tsx')).toEqual(['/builds/solara'])
    expect(pagesFor('components/sections/HeroGrid.tsx', 'components/log/LogFeed.tsx')).toEqual(['/', '/builds'])
  })

  it("audits an image's pages through the areas that own it, and every page for one no area owns", () => {
    const shot = tracked.find((f) => f.startsWith('public/builds/solara/'))!
    expect(pagesFor(shot)).toEqual(expect.arrayContaining(['/builds/solara']))
    expect(pagesFor('public/brand-new-folder/x.webp')).toBe('all')
  })

  it('skips tests, docs, data, and code no audited page uses', () => {
    for (const f of ['tests/e2e/hero.spec.ts', 'tests/unit/seo.test.ts', 'tests/e2e/areas.json', 'docs/HANDOFF.md', 'data/builds.tsx', 'app/api/contact/route.ts', 'lib/email/waitlist.ts', 'app/upcoming/page.tsx'])
      expect(pagesFor(f), f).toEqual([])
  })

  it('prints all, none or the pages, and ci.yml skips the job on none and passes the pages on', () => {
    expect(lighthouseOutput({ pages: 'all' })).toBe('all')
    expect(lighthouseOutput({ pages: [] })).toBe('none')
    expect(lighthouseOutput({ pages: ['/', '/builds'] })).toBe('/,/builds')
    expect(planFor('push', '', null).lighthouse.pages).toBe('all')
    expect(planFor('pull_request', 'true', ['tests/unit/seo.test.ts']).lighthouse.pages).toBe('all')
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(ci).toContain("if: needs.changes.outputs.code == 'true' && needs.changes.outputs.lighthouse != 'none'")
    expect(ci).toContain("LIGHTHOUSE_PAGES: ${{ needs.changes.outputs.lighthouse != 'all' && needs.changes.outputs.lighthouse || '' }}")
    expect(ci).toContain('lighthouse: ${{ steps.e2e.outputs.lighthouse }}')
  })
})
