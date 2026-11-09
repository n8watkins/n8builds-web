// The Playwright jobs ci.yml runs, by tier (tests/e2e/README.md has the rules):
//
// - affected: a pull request. The @smoke tests, plus the spec files of the
//          areas the pull request changes (tests/e2e/areas.json), on
//          Chromium; the API specs among them; and their @cross-browser
//          tests on Firefox, WebKit and the two phones.
// - pr:    a pull request that changes a shared file (the layout, the global
//          CSS, the Next or Playwright config, package.json...), or one whose
//          changes can't be listed. The API tests and the whole suite on
//          Chromium, plus every @cross-browser test on the other browsers.
// - smoke: a push to main. The tests tagged @smoke on Chromium: the pull
//          request already ran the rest on this code.
// - full:  the nightly run, the release train, "Run workflow" (unless "full"
//          is unticked) and a pull request labelled full-e2e: every test on
//          every project.
//
// Prints `tier=...` and `matrix=...` lines for $GITHUB_OUTPUT:
//   node scripts/e2e-matrix.mjs <event> <full> [changed-files.txt]
// <full> is "true" (the `full` input, or the full-e2e label), "false" or "".
// [changed-files.txt] lists the pull request's changed paths, one per line.
//
// `node scripts/e2e-matrix.mjs --explain <path>...` shows what each path
// selects, for checking the map by hand.

import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const AREAS_FILE = 'tests/e2e/areas.json'
const E2E_DIR = 'tests/e2e/'

/**
 * One job: a project, optionally a shard of it, one worker where the browser
 * is slow enough to overload the runner with two, a title filter, and the
 * spec files to run (all of them when empty).
 * @param {string} project
 * @param {{ shard?: string, workers?: number, grep?: string, files?: string[], label?: string }} [options]
 */
const job = (project, { shard, workers, grep, files, label } = {}) => ({
  id: [project, (label ?? grep?.slice(1))?.replace(/[^a-z0-9]+/g, '-'), shard?.replace('/', 'of')].filter(Boolean).join('-'),
  name: [project, label ?? grep, shard].filter(Boolean).join(' '),
  project,
  shard: shard ?? '',
  workers: workers ?? '',
  grep: grep ?? '',
  files: (files ?? []).join(' '),
})

/**
 * A project in `count` shards (no shard at all when `count` is 1).
 * @param {string} project
 * @param {number} count
 * @param {Parameters<typeof job>[1]} [options]
 */
const sharded = (project, count, options = {}) =>
  count <= 1
    ? [job(project, options)]
    : Array.from({ length: count }, (_, i) => job(project, { ...options, shard: `${i + 1}/${count}` }))

export const MATRIX = {
  // WebKit and mobile Safari are the slowest projects, and with two workers
  // they overloaded the runner and timed out at random on main: one worker,
  // in thirds (as halves, the first half took 20 to 24 of its 25 minutes).
  full: [
    job('api'),
    job('chromium'),
    job('firefox'),
    ...sharded('webkit', 3, { workers: 1 }),
    job('mobile-chrome'),
    ...sharded('mobile-safari', 3, { workers: 1 }),
  ],
  pr: [
    job('api'),
    ...sharded('chromium', 2),
    job('firefox', { grep: '@cross-browser' }),
    ...sharded('webkit', 2, { workers: 1, grep: '@cross-browser' }),
    job('mobile-chrome', { grep: '@cross-browser' }),
    ...sharded('mobile-safari', 2, { workers: 1, grep: '@cross-browser' }),
  ],
  smoke: [job('chromium', { grep: '@smoke' })],
}

/**
 * The tier for a run: the `full` input (or label) wins, then the event decides.
 * A pull request starts as "affected"; selectFor() widens it to "pr" when a
 * shared file changed.
 * @param {string} event github.event_name
 * @param {string} full "true", "false" or ""
 * @returns {'full' | 'pr' | 'smoke'}
 */
export function tierFor(event, full) {
  if (full === 'true') return 'full'
  if (event === 'push') return 'smoke'
  return 'pr'
}

// ---------------------------------------------------------------------------
// The area map (tests/e2e/areas.json)

/** @typedef {{ specs: string[], sources: string[] }} Group */
/** @typedef {{ pages: Record<string, string>, run: string[], skip: string[] }} LighthouseMap */
/** @typedef {{ shared: string[], none: string[], inherit: string[], always: string[], lighthouse: LighthouseMap, groups: Record<string, Group> }} Areas */

/** @returns {Areas} */
export function loadAreas(root = ROOT) {
  return JSON.parse(readFileSync(join(root, AREAS_FILE), 'utf8'))
}

/**
 * A glob as a RegExp: `**` spans folders, `*` and `?` stay inside one, and
 * `{a,b}` is either. Matched against the whole repo-relative path.
 * @param {string} glob
 */
export function globToRegExp(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*' && glob[i + 1] === '*') {
      i++
      if (glob[i + 1] === '/') {
        i++
        re += '(?:.*/)?'
      } else re += '.*'
    } else if (c === '*') re += '[^/]*'
    else if (c === '?') re += '[^/]'
    else if (c === '{') re += '(?:'
    else if (c === '}') re += ')'
    else if (c === ',') re += '|'
    else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${re}$`)
}

const globCache = new Map()
/** Whether `path` matches any of `globs`. */
export function matchesAny(path, globs) {
  return globs.some((glob) => {
    if (!globCache.has(glob)) globCache.set(glob, globToRegExp(glob))
    return globCache.get(glob).test(path)
  })
}

const isSpec = (path) => path.startsWith(E2E_DIR) && path.endsWith('.spec.ts')

// ---------------------------------------------------------------------------
// The import graph: which files import which, so a change to a building
// block (a hook, a lib file, a UI component) reaches the areas that use it.

const CODE_EXTENSIONS = ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.cjs']
const RESOLVE_EXTENSIONS = [...CODE_EXTENSIONS, '.json', '.css']
const GRAPH_ROOTS = ['app', 'components', 'lib', 'data', 'hooks', 'tests/e2e', 'tests/e2e-env.ts', 'instrumentation.ts', 'instrumentation-client.ts', 'next.config.mjs', 'playwright.config.ts', 'sentry.edge.config.ts', 'sentry.server.config.ts']
const IMPORT_RE = /\bfrom\s*['"]([^'"\n]+)['"]|\bimport\s*['"]([^'"\n]+)['"]|\bimport\(\s*['"]([^'"\n]+)['"]\s*\)|\brequire\(\s*['"]([^'"\n]+)['"]\s*\)/g

/** Every code file under the graph's roots, repo-relative. */
function codeFiles(root) {
  const out = []
  const walk = (rel) => {
    const abs = join(root, rel)
    if (!existsSync(abs)) return
    if (statSync(abs).isDirectory()) {
      for (const entry of readdirSync(abs)) if (entry !== 'node_modules') walk(`${rel}/${entry}`)
    } else if (CODE_EXTENSIONS.some((ext) => rel.endsWith(ext))) out.push(rel)
  }
  for (const r of GRAPH_ROOTS) walk(r)
  return out
}

/** The repo file an import specifier names, or null for a package. */
function resolveImport(root, from, spec) {
  let base
  if (spec.startsWith('@/')) base = spec.slice(2)
  else if (spec.startsWith('.')) base = normalize(join(dirname(from), spec))
  else return null
  base = base.replace(/\\/g, '/')
  for (const candidate of [base, ...RESOLVE_EXTENSIONS.map((e) => base + e), ...RESOLVE_EXTENSIONS.map((e) => `${base}/index${e}`)]) {
    const abs = join(root, candidate)
    if (existsSync(abs) && statSync(abs).isFile()) return candidate
  }
  return null
}

/**
 * For each repo file, the files that import it (directly).
 * @returns {Map<string, Set<string>>}
 */
export function buildImporters(root = ROOT) {
  /** @type {Map<string, Set<string>>} */
  const importers = new Map()
  for (const file of codeFiles(root)) {
    const text = readFileSync(join(root, file), 'utf8')
    for (const m of text.matchAll(IMPORT_RE)) {
      const target = resolveImport(root, file, m[1] ?? m[2] ?? m[3] ?? m[4])
      if (!target || target === file) continue
      if (!importers.has(target)) importers.set(target, new Set())
      importers.get(target).add(file)
    }
  }
  return importers
}

// ---------------------------------------------------------------------------
// Selection: the spec files a set of changed paths can affect.

/**
 * What one changed path selects:
 * - `none`: a path no browser test depends on (unit tests, scripts, docs).
 * - `full`: a shared path, or one the map doesn't know (the safe default).
 * - otherwise the spec files it reaches: itself if it is a spec, the specs of
 *   every group whose sources match it or any file that imports it, however
 *   indirectly, and any spec that imports it. The walk stops at shared files
 *   (the layout imports most of the site chrome; reaching it adds nothing).
 * @param {string} path
 * @param {Areas} areas
 * @param {Map<string, Set<string>>} importers
 * @returns {{ kind: 'none' } | { kind: 'full', why: string } | { kind: 'specs', specs: string[], groups: string[] }}
 */
export function explain(path, areas, importers) {
  if (matchesAny(path, areas.shared)) return { kind: 'full', why: 'a shared file' }
  if (matchesAny(path, areas.none)) return { kind: 'none' }
  const groupNames = Object.keys(areas.groups)
  const inGroup = (file) => groupNames.filter((g) => matchesAny(file, areas.groups[g].sources))
  if (!isSpec(path) && inGroup(path).length === 0 && !matchesAny(path, areas.inherit)) {
    return { kind: 'full', why: `not in ${AREAS_FILE}` }
  }

  const specs = new Set()
  const groups = new Set()
  const seen = new Set([path])
  const queue = [path]
  while (queue.length) {
    const file = queue.shift()
    if (file !== path && matchesAny(file, areas.shared)) continue
    if (isSpec(file)) specs.add(file)
    for (const g of inGroup(file)) groups.add(g)
    for (const importer of importers.get(file) ?? []) {
      if (!seen.has(importer)) {
        seen.add(importer)
        queue.push(importer)
      }
    }
  }
  for (const g of groups) for (const spec of areas.groups[g].specs) specs.add(spec)
  if (specs.size === 0) {
    // A building block nothing imports isn't part of the site (yet).
    if (!importers.has(path)) return { kind: 'none' }
    return { kind: 'full', why: 'reaches no area (only shared files import it)' }
  }
  return { kind: 'specs', specs: [...specs].sort(), groups: [...groups].sort() }
}

/**
 * The spec files a pull request must run, or `full` when it must run them all.
 * The `always` groups join any selection that has a code change.
 * @param {string[]} changed repo-relative paths
 * @param {Areas} areas
 * @param {Map<string, Set<string>>} importers
 */
export function selectFor(changed, areas, importers) {
  const specs = new Set()
  /** @type {Record<string, ReturnType<typeof explain>>} */
  const reasons = {}
  let full = false
  for (const path of changed) {
    const result = explain(path, areas, importers)
    reasons[path] = result
    if (result.kind === 'full') full = true
    if (result.kind === 'specs') for (const s of result.specs) specs.add(s)
  }
  if (specs.size > 0) for (const g of areas.always) for (const s of areas.groups[g].specs) specs.add(s)
  return { full, specs: full ? [] : [...specs].sort(), reasons }
}

// ---------------------------------------------------------------------------
// The affected tier's jobs.

// About how many tests one Chromium job (two workers) clears in the time the
// slowest cross-browser job takes, and one WebKit job (one worker) the same.
const CHROMIUM_PER_SHARD = 150
const WEBKIT_PER_SHARD = 60

/** A rough test count for a spec: its test( calls (loops make it low). */
function weightOf(root, spec, tag) {
  const text = readFileSync(join(root, spec), 'utf8')
  if (tag && !text.includes(tag)) return 0
  return Math.max(1, (text.match(/\btest\(/g) ?? []).length)
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The jobs for the affected tier: @smoke plus the selected Chromium specs in
 * one job (sharded when large), the selected API specs, and the selected
 * specs' @cross-browser tests on each other browser that has any.
 * @param {string[]} specs repo-relative spec paths
 */
export function affectedMatrix(specs, root = ROOT) {
  const api = specs.filter((s) => s.startsWith(`${E2E_DIR}api/`))
  const browser = specs.filter((s) => !s.startsWith(`${E2E_DIR}api/`))
  const jobs = []
  if (api.length) jobs.push(job('api', { files: api, label: 'affected' }))

  // One --grep: a test runs if it is @smoke or in a selected file. Playwright
  // matches --grep against "<project> <file> <titles> <tags>", the file
  // relative to tests/e2e, so " hero\.spec\.ts " names one file exactly.
  const names = browser.map((s) => escapeRe(s.slice(E2E_DIR.length)))
  const grep = names.length ? `@smoke|(^| )(${names.join('|')}) ` : '@smoke'
  const chromiumWeight = 60 + browser.reduce((n, s) => n + weightOf(root, s), 0)
  jobs.push(...sharded('chromium', Math.min(2, Math.ceil(chromiumWeight / CHROMIUM_PER_SHARD)), { grep, label: names.length ? 'smoke+affected' : 'smoke' }))

  const crossBrowser = browser.filter((s) => weightOf(root, s, '@cross-browser') > 0)
  if (crossBrowser.length) {
    const weight = crossBrowser.reduce((n, s) => n + weightOf(root, s, '@cross-browser'), 0)
    const slowShards = Math.min(2, Math.ceil(weight / WEBKIT_PER_SHARD))
    const options = { grep: '@cross-browser', files: crossBrowser, label: 'cross-browser affected' }
    jobs.push(
      job('firefox', options),
      ...sharded('webkit', slowShards, { ...options, workers: 1 }),
      job('mobile-chrome', options),
      ...sharded('mobile-safari', slowShards, { ...options, workers: 1 }),
    )
  }
  return jobs
}

/**
 * The tier and jobs for a run.
 * @param {string} event
 * @param {string} full
 * @param {string[] | null} changed the pull request's paths, or null if unknown
 */
export function planFor(event, full, changed, root = ROOT) {
  const tier = tierFor(event, full)
  if (tier !== 'pr' || event !== 'pull_request' || !changed) return { tier, jobs: MATRIX[tier], selection: null, lighthouse: { pages: 'all', reasons: {} } }
  const areas = loadAreas(root)
  const importers = buildImporters(root)
  const selection = selectFor(changed, areas, importers)
  const lighthouse = lighthouseFor(changed, areas, importers)
  if (selection.full) return { tier: 'pr', jobs: MATRIX.pr, selection, lighthouse }
  return { tier: 'affected', jobs: affectedMatrix(selection.specs, root), selection, lighthouse }
}

// ---------------------------------------------------------------------------
// Lighthouse: which of its pages a pull request can slow down.

/**
 * The Lighthouse pages one changed path can affect: 'all', or a list (empty
 * when it can't affect any). See areas.json's "lighthouse" entry.
 * @param {string} path
 * @param {Areas} areas
 * @param {Map<string, Set<string>>} importers
 * @returns {{ pages: 'all' | string[], why: string }}
 */
export function lighthouseExplain(path, areas, importers) {
  const { pages, run, skip } = areas.lighthouse
  if (matchesAny(path, run)) return { pages: 'all', why: 'the audit itself' }
  if (matchesAny(path, skip)) return { pages: [], why: 'tests and data' }
  if (matchesAny(path, areas.shared)) return { pages: 'all', why: 'a shared file' }
  if (matchesAny(path, areas.none)) return { pages: [], why: 'no page uses it' }

  let starts = [path]
  if (path.startsWith('public/')) {
    // An image or a clip: the code of the areas that own it.
    const owners = Object.values(areas.groups).filter((g) => matchesAny(path, g.sources))
    if (owners.length === 0) return { pages: 'all', why: 'an asset no area owns' }
    const ownGlobs = owners.flatMap((g) => g.sources.filter((glob) => !glob.startsWith('public/')))
    starts = [...new Set([...importers.keys(), ...[...importers.values()].flatMap((s) => [...s])])].filter((f) => matchesAny(f, ownGlobs))
  } else {
    const known = isSpec(path) || matchesAny(path, areas.inherit) || Object.values(areas.groups).some((g) => matchesAny(path, g.sources))
    if (!known) return { pages: 'all', why: `not in ${AREAS_FILE}` }
  }

  const routes = new Map(Object.entries(pages).map(([page, route]) => [route, page]))
  const hit = new Set()
  const seen = new Set(starts)
  const queue = [...starts]
  while (queue.length) {
    const file = queue.shift()
    // The layout renders on every page: whatever reaches it can slow them all.
    if (!starts.includes(file) && matchesAny(file, areas.shared)) return { pages: 'all', why: `${file} uses it` }
    if (routes.has(file)) hit.add(routes.get(file))
    for (const importer of importers.get(file) ?? []) {
      if (!seen.has(importer)) {
        seen.add(importer)
        queue.push(importer)
      }
    }
  }
  if (hit.size > 0) return { pages: Object.keys(pages).filter((p) => hit.has(p)), why: 'its pages' }
  return { pages: [], why: 'no audited page uses it' }
}

/**
 * The Lighthouse pages a pull request audits: 'all', or a list (empty: skip).
 * @param {string[]} changed
 * @param {Areas} areas
 * @param {Map<string, Set<string>>} importers
 */
export function lighthouseFor(changed, areas, importers) {
  /** @type {Record<string, ReturnType<typeof lighthouseExplain>>} */
  const reasons = {}
  const pages = new Set()
  let all = false
  for (const path of changed) {
    const r = lighthouseExplain(path, areas, importers)
    reasons[path] = r
    if (r.pages === 'all') all = true
    else for (const p of r.pages) pages.add(p)
  }
  const every = Object.keys(areas.lighthouse.pages)
  if (all || every.every((p) => pages.has(p))) return { pages: /** @type {'all'} */ ('all'), reasons }
  return { pages: every.filter((p) => pages.has(p)), reasons }
}

/** The changes job's `lighthouse` output: "all", "none", or the pages, comma-separated. */
export const lighthouseOutput = (lighthouse) => (lighthouse.pages === 'all' ? 'all' : lighthouse.pages.join(',') || 'none')

/** A Markdown summary of the selection, for $GITHUB_STEP_SUMMARY. */
export function summarize(plan) {
  const lines = [`### E2E: the ${plan.tier} tier`, '']
  if (plan.selection) {
    lines.push('| Changed | Runs |', '| --- | --- |')
    for (const [path, r] of Object.entries(plan.selection.reasons)) {
      const runs = r.kind === 'none' ? 'nothing' : r.kind === 'full' ? `everything (${r.why})` : r.groups.length ? r.groups.join(', ') : r.specs.map((s) => s.slice(E2E_DIR.length)).join(', ')
      lines.push(`| \`${path}\` | ${runs} |`)
    }
    if (plan.tier === 'affected') lines.push('', `Specs: ${plan.selection.specs.map((s) => `\`${s.slice(E2E_DIR.length)}\``).join(', ') || 'none (only @smoke)'}`)
  }
  lines.push('', `Jobs: ${plan.jobs.map((j) => j.name).join('; ')}`)
  const lh = lighthouseOutput(plan.lighthouse)
  lines.push('', `### Lighthouse: ${lh === 'all' ? 'every page' : lh === 'none' ? 'skipped' : lh}`)
  const lhReasons = Object.entries(plan.lighthouse.reasons)
  if (lhReasons.length) {
    lines.push('', '| Changed | Audits |', '| --- | --- |')
    for (const [path, r] of lhReasons) lines.push(`| \`${path}\` | ${r.pages === 'all' ? 'every page' : r.pages.join(', ') || 'nothing'} (${r.why}) |`)
  }
  return lines.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  if (args[0] === '--explain') {
    const areas = loadAreas()
    const importers = buildImporters()
    for (const path of args.slice(1)) console.log(path, JSON.stringify(explain(relative(ROOT, join(process.cwd(), path)), areas, importers)))
  } else {
    const [event = '', full = '', changedFile = ''] = args
    let changed = null
    if (changedFile && existsSync(changedFile)) changed = readFileSync(changedFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
    const plan = planFor(event, full, changed)
    console.log(`tier=${plan.tier}`)
    console.log(`matrix=${JSON.stringify({ include: plan.jobs })}`)
    console.log(`lighthouse=${lighthouseOutput(plan.lighthouse)}`)
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summarize(plan)}\n`)
    }
  }
}
