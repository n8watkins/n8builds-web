// Lighthouse budgets for the production build (run `npm run build` first).
//
// Starts `next start`, audits each page several times with Lighthouse's desktop
// preset (BUDGETS) and a few pages with its mobile preset (MOBILE_BUDGETS), and
// checks the median of every metric. Writes the HTML report of each page's
// median run to .lighthouse/. Exits 1 if an "error" budget fails; "warn"
// budgets only print.
//
// Env: LIGHTHOUSE_PORT (default 3747), CHROME_PATH (needed under WSL: a Linux Chrome).

import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse, { desktopConfig } from 'lighthouse'

const PORT = Number(process.env.LIGHTHOUSE_PORT) || 3747
const BASE = `http://localhost:${PORT}`
const PAGES = ['/', '/blog', '/builds', '/builds/solara', '/loadout']
// Five runs per page: the median of three let one slow CI runner fail a
// budget on its own (the homepage once scored 0.83, then 0.99 on a rerun).
const RUNS = 5
// A run whose metrics come back empty is a Lighthouse error, not a score
// (seen on /blog in CI as a crash on null.toFixed): retry it, and if it keeps
// failing, report Lighthouse's own error instead of crashing.
const RETRIES = 2
const REPORT_DIR = '.lighthouse'

/** [label, read(lhr), level, limit, direction] */
const BUDGETS = [
  ['performance', (lhr) => lhr.categories.performance.score, 'error', 0.9, 'min'],
  ['accessibility', (lhr) => lhr.categories.accessibility.score, 'error', 0.95, 'min'],
  ['best practices', (lhr) => lhr.categories['best-practices'].score, 'warn', 0.9, 'min'],
  ['seo', (lhr) => lhr.categories.seo.score, 'warn', 0.9, 'min'],
  ['FCP (ms)', (lhr) => lhr.audits['first-contentful-paint'].numericValue, 'error', 1800, 'max'],
  ['LCP (ms)', (lhr) => lhr.audits['largest-contentful-paint'].numericValue, 'error', 2500, 'max'],
  ['CLS', (lhr) => lhr.audits['cumulative-layout-shift'].numericValue, 'error', 0.1, 'max'],
  ['TBT (ms)', (lhr) => lhr.audits['total-blocking-time'].numericValue, 'warn', 200, 'max'],
]

// Lighthouse's default (mobile) form factor: a mid-range phone on slow 4G with
// a 4x slower CPU. Desktop alone hid a homepage at 0.77 and LCP ~4s on phones
// (2026-10-25). These budgets sit below today's numbers (home ~0.81, /blog
// ~0.98, /builds ~0.96 locally) to catch a real regression, not runner noise.
const MOBILE_PAGES = ['/', '/blog', '/builds']
const MOBILE_BUDGETS = [
  ['performance', (lhr) => lhr.categories.performance.score, 'error', 0.7, 'min'],
  ['LCP (ms)', (lhr) => lhr.audits['largest-contentful-paint'].numericValue, 'error', 5000, 'max'],
  ['CLS', (lhr) => lhr.audits['cumulative-layout-shift'].numericValue, 'error', 0.1, 'max'],
  ['TBT (ms)', (lhr) => lhr.audits['total-blocking-time'].numericValue, 'warn', 500, 'max'],
]

const FORMS = [
  { name: 'desktop', config: desktopConfig, pages: PAGES, budgets: BUDGETS, runs: RUNS },
  // Three runs: its budgets are loose regression guards, and CI time matters.
  { name: 'mobile', config: undefined, pages: MOBILE_PAGES, budgets: MOBILE_BUDGETS, runs: 3 },
]

/** Why a Lighthouse run can't be scored (its own runtime error, or empty metrics), or null. */
function runProblem(result, budgets) {
  if (!result) return 'no result'
  const { lhr } = result
  if (lhr.runtimeError) return `${lhr.runtimeError.code}: ${lhr.runtimeError.message}`
  const empty = budgets.filter(([, read]) => typeof read(lhr) !== 'number').map(([label]) => label)
  if (empty.length) {
    const lcp = lhr.audits['largest-contentful-paint']
    return `no value for ${empty.join(', ')}${lcp?.errorMessage ? ` (${lcp.errorMessage})` : ''}`
  }
  return null
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

async function waitForServer(server) {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(`next start exited with code ${server.exitCode}`)
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Server did not start on ${BASE}`)
}

/**
 * Start headless Chrome, retrying a launch that never reports its debugging
 * port: on a busy CI runner Chrome occasionally starts too slowly for
 * chrome-launcher ("waiting for dynamic debugging port"), which is the runner,
 * not the site.
 */
async function launchChrome(profile, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    // A fresh profile per attempt: a Chrome that failed to start can still hold the last one's lock.
    const dir = join(profile, `attempt-${attempt}`)
    mkdirSync(dir)
    try {
      return await chromeLauncher.launch({
        userDataDir: dir,
        chromeFlags: ['--headless=new', `--user-data-dir=${dir}`, ...(process.env.CI ? ['--no-sandbox'] : [])],
        // 60 polls of 500ms: 30s for Chrome to come up.
        maxConnectionRetries: 60,
      })
    } catch (error) {
      if (attempt >= attempts) throw error
      console.warn(`Chrome did not start (attempt ${attempt} of ${attempts}): ${error.message}; retrying`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

async function main() {
  // Own process group, so cleanup stops next-server itself and not just a wrapper.
  const server = spawn('node_modules/.bin/next', ['start', '-p', String(PORT)], {
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: true,
  })
  // A dedicated profile dir, passed again as the last --user-data-dir: under
  // WSL, chrome-launcher rewrites the path for Windows Chrome, which a Linux
  // Chrome would create as a literal "C:\Users\..." folder in the repo.
  const profile = mkdtempSync(join(tmpdir(), 'lighthouse-'))
  let chrome
  let failed = false

  try {
    await waitForServer(server)
    chrome = await launchChrome(profile)
    mkdirSync(REPORT_DIR, { recursive: true })

    for (const form of FORMS) for (const path of form.pages) {
      const runs = []
      for (let i = 0; i < form.runs; i++) {
        let result
        for (let attempt = 0; attempt <= RETRIES; attempt++) {
          result = await lighthouse(`${BASE}${path}`, { port: chrome.port, output: 'html', logLevel: 'error' }, form.config)
          const problem = runProblem(result, form.budgets)
          if (!problem) break
          console.log(`  retry ${path} (${form.name}) run ${i + 1}: ${problem}`)
          if (attempt === RETRIES) throw new Error(`Lighthouse could not audit ${path} (${form.name}): ${problem}`)
        }
        runs.push(result)
      }

      console.log(`\n${path}${form.name === 'desktop' ? '' : ` (${form.name})`}`)
      for (const [label, read, level, limit, direction] of form.budgets) {
        const value = median(runs.map((run) => read(run.lhr)))
        const ok = direction === 'min' ? value >= limit : value <= limit
        if (!ok && level === 'error') failed = true
        const shown = Number.isInteger(limit) ? Math.round(value) : value.toFixed(3)
        const status = ok ? 'ok  ' : level === 'error' ? 'FAIL' : 'warn'
        console.log(`  ${status} ${label.padEnd(15)} ${String(shown).padStart(6)}  (${direction} ${limit})`)
      }

      // Keep the report of the run with the median performance score.
      const medianScore = median(runs.map((run) => run.lhr.categories.performance.score))
      const report = runs.find((run) => run.lhr.categories.performance.score === medianScore).report
      const name = `${path === '/' ? 'home' : path.slice(1).replaceAll('/', '_')}${form.name === 'desktop' ? '' : `-${form.name}`}`
      writeFileSync(join(REPORT_DIR, `${name}.html`), report)
    }
  } finally {
    await chrome?.kill()
    try {
      process.kill(-server.pid, 'SIGTERM')
    } catch {
      // Already gone.
    }
    rmSync(profile, { recursive: true, force: true })
  }

  console.log(failed ? '\nLighthouse budgets failed.' : `\nAll error budgets passed. Reports: ${REPORT_DIR}/`)
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
