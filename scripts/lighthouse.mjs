// Lighthouse budgets for the production build (run `npm run build` first).
//
// Starts `next start`, audits each page RUNS times with Lighthouse's desktop
// preset, and checks the median of every metric against BUDGETS. Writes the
// HTML report of each page's median run to .lighthouse/. Exits 1 if an
// "error" budget fails; "warn" budgets only print.
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
const RUNS = 3
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
    chrome = await chromeLauncher.launch({
      userDataDir: profile,
      chromeFlags: ['--headless=new', `--user-data-dir=${profile}`, ...(process.env.CI ? ['--no-sandbox'] : [])],
    })
    mkdirSync(REPORT_DIR, { recursive: true })

    for (const path of PAGES) {
      const runs = []
      for (let i = 0; i < RUNS; i++) {
        const result = await lighthouse(`${BASE}${path}`, { port: chrome.port, output: 'html', logLevel: 'error' }, desktopConfig)
        if (!result) throw new Error(`Lighthouse returned no result for ${path}`)
        runs.push(result)
      }

      console.log(`\n${path}`)
      for (const [label, read, level, limit, direction] of BUDGETS) {
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
      const name = path === '/' ? 'home' : path.slice(1).replaceAll('/', '_')
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
