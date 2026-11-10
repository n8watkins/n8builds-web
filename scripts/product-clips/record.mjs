// Records a short clip of a build in use for its build page (owner,
// 2026-11-08; real use since 2026-11-09): Playwright drives a real browser
// through a storyboard and saves the take; encode.sh trims, scales and
// compresses it into public/builds/<slug>/clip.{webm,mp4} (or clip-phone.* for
// the phone take) and its poster.
//   node scripts/product-clips/record.mjs <openping|solara|wren> <outDir> [--phone]
//
// Solara: its live app as a guest (no sign-in, nothing saved anywhere).
//
// Wren: its live app as a guest, asking one question; the answer is a genuine
// one of Wren's, replayed, since a recording must not get around the guest's
// Turnstile check (wren-replay.mjs).
//
// OpenPing: the real product in use, signed in, adding a check and watching
// its status page pick it up. That needs an admin, so it runs against a local,
// throwaway OpenPing, never the live one: in an open-ping checkout run
// `npm run build && node e2e/serve.mjs` (a local D1 with one signed-in admin
// session, on port 8799), and pass that checkout as OPENPING_REPO so the take
// can seed demo monitors with 90 days of history. Every run starts from the
// same three monitors (Website, Docs, API) and adds "n8builds".
import { chromium, devices } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { replayWren, WREN, wrenAnswer } from './wren-replay.mjs'

const [slug, outDir, flag] = process.argv.slice(2)
if (!slug || !outDir) throw new Error('usage: record.mjs <openping|solara|wren> <outDir> [--phone]')
const phone = flag === '--phone'
mkdirSync(outDir, { recursive: true })

// The desktop take fills the build page's stage at 1280x800; the phone take is
// a phone's own viewport (an iPhone 14's width). Playwright records CSS
// pixels, whatever the device's pixel ratio.
const SIZE = phone ? { width: 390, height: 760 } : { width: 1280, height: 800 }
const pause = (page, ms) => page.waitForTimeout(ms)

/** A smooth scroll by `y` pixels over `ms`, like a person reading down. */
async function glide(page, y, ms) {
  await page.evaluate(
    ([y, ms]) =>
      new Promise((done) => {
        const start = scrollY
        const t0 = performance.now()
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms)
          scrollTo(0, start + y * (1 - Math.cos(Math.PI * k)) / 2)
          k < 1 ? requestAnimationFrame(step) : done()
        }
        requestAnimationFrame(step)
      }),
    [y, ms],
  )
}

/** Brings an element to the middle of the window with a glide, as a person would scroll to it. */
async function glideTo(page, locator, ms = 700) {
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  await glide(page, box.y + box.height / 2 - viewport.height / 2, ms)
}

/** Types like a person, a key at a time. */
const typeSlowly = (locator, text) => locator.pressSequentially(text, { delay: 70 })

// The local OpenPing (open-ping's e2e/serve.mjs and e2e/env.mjs).
const OPENPING = 'http://localhost:8799'
const SESSION = 'e2e-session-token-for-local-tests-only'
const CSRF = 'e2e-csrf-secret'
const DAY = 86_400_000

async function openpingApi(method, path, body) {
  const res = await fetch(OPENPING + path, {
    method,
    headers: { cookie: `op_session=${SESSION}`, 'x-csrf-token': CSRF, 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`)
  return text ? JSON.parse(text) : {}
}

/**
 * Demo data on the local OpenPing: a public status page and three monitors with
 * 90 days of daily history (a few rough days), and no "n8builds" monitor yet.
 */
async function seedOpenPing() {
  const repo = process.env.OPENPING_REPO
  if (!repo) throw new Error('OPENPING_REPO: the open-ping checkout running e2e/serve.mjs')
  await openpingApi('PATCH', '/api/status-pages/sp_default', {
    enabled: true,
    name: 'Acme Status',
    description: 'Live status of the Acme apps.',
  })
  const { monitors } = await openpingApi('GET', '/api/monitors')
  for (const m of monitors.filter((m) => m.name === 'n8builds')) await openpingApi('DELETE', `/api/monitors/${m.id}`)
  const ids = []
  for (const [name, url] of [
    ['Website', 'https://example.com'],
    ['Docs', 'https://developer.mozilla.org'],
    ['API', 'https://httpbin.org/status/200'],
  ]) {
    const found = monitors.find((m) => m.name === name)
    ids.push(found ? found.id : (await openpingApi('POST', '/api/monitors', { type: 'http', name, config: { url }, public: { visible: true } })).monitor.id)
  }
  const today = Math.floor(Date.now() / DAY) * DAY
  const rough = { 1: [44], 2: [23, 61] }
  const rows = ids.flatMap((id, m) =>
    Array.from({ length: 89 }, (_, i) => {
      const start = today - (i + 1) * DAY
      const fail = rough[m]?.includes(i + 1) ? 6 : 0
      return `('${id}:day:${start}','${id}','day',${start},120,${120 - fail},${fail},0,30000,120,600,86400,${fail * 720})`
    }),
  )
  const sql = join(mkdtempSync(join(tmpdir(), 'openping-seed-')), 'seed.sql')
  writeFileSync(
    sql,
    `INSERT OR IGNORE INTO summaries (id,monitor_id,period,bucket_start,checks,ok_checks,fail_checks,retry_recoveries,sum_latency_ms,min_latency_ms,max_latency_ms,monitored_seconds,down_seconds) VALUES ${rows.join(',')};`,
  )
  execFileSync(
    join(repo, 'node_modules/.bin/wrangler'),
    ['d1', 'execute', 'DB', '--local', '--persist-to', 'e2e/.state', '-c', 'dist/open_ping/wrangler.json', '--file', sql],
    { cwd: repo, stdio: 'ignore', env: { ...process.env, CI: '1' } },
  )
}

const storyboards = {
  // The status page, then the admin adding a check for n8builds.dev, which is
  // checked at once and shows up on the status page as operational.
  openping: {
    origin: OPENPING,
    seed: seedOpenPing,
    warm: [`${OPENPING}/status`, `${OPENPING}/`, `${OPENPING}/monitors/new`],
    async play(page) {
      await page.goto(`${OPENPING}/status`, { waitUntil: 'networkidle' })
      await pause(page, 1600)
      await page.goto(`${OPENPING}/`, { waitUntil: 'networkidle' })
      await pause(page, 1200)
      await page.getByRole('link', { name: /Add monitor/ }).first().click()
      await page.waitForURL(/\/monitors\/new/)
      await pause(page, 600)
      const name = page.getByLabel(/^Name/)
      await name.click()
      await typeSlowly(name, 'n8builds')
      await pause(page, 250)
      const url = page.getByLabel(/^URL/)
      await url.click()
      await typeSlowly(url, 'https://n8builds.dev')
      await pause(page, 500)
      const show = page.getByLabel('Show on public status pages')
      await glideTo(page, show, 900)
      await pause(page, 300)
      await show.check()
      await pause(page, 500)
      await page.getByRole('button', { name: 'Create monitor' }).click()
      await page.waitForURL(/\/monitors\/mon_/)
      await page.getByText('Up', { exact: true }).first().waitFor()
      // The app keeps the form's scroll on the new page; back up to its name and state.
      await pause(page, 300)
      await glide(page, -(await page.evaluate(() => scrollY)), 700)
      await pause(page, 1500)
      await page.goto(`${OPENPING}/status`, { waitUntil: 'networkidle' })
      await pause(page, 700)
      const added = page.getByText('n8builds', { exact: true })
      await glideTo(page, added, 800)
      await pause(page, 2200)
    },
  },
  // A guest's first minute: the city, the skin type, the day's UV, then a run's lower-UV window.
  solara: {
    origin: 'https://solara-uv.web.app',
    warm: ['https://solara-uv.web.app/app/'],
    async play(page) {
      await page.goto('https://solara-uv.web.app/app/', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Not now' }).click().catch(() => {})
      await pause(page, 500)
      await typeSlowly(page.getByPlaceholder(/Type a city/), 'Sydney')
      await page.getByRole('button', { name: 'Go' }).click()
      await pause(page, 1200)
      await page.getByRole('button', { name: 'Continue' }).click()
      await pause(page, 700)
      await page.getByRole('button', { name: /Medium/ }).click()
      await pause(page, 400)
      await page.getByRole('button', { name: 'Continue' }).click()
      await pause(page, 700)
      await page.getByRole('button', { name: "See today's plan" }).click()
      await pause(page, 1800)
      await page.getByRole('button', { name: '+ Add activity' }).click()
      await pause(page, 900)
      await page.getByRole('dialog').getByText('Running', { exact: true }).click()
      await pause(page, 500)
      await page.getByRole('button', { name: 'Done' }).click()
      await pause(page, 2600)
    },
  },
  // A guest asks a question and reads the answer as Wren writes it.
  wren: {
    origin: WREN,
    warm: [`${WREN}/`],
    prepare: replayWren,
    async play(page) {
      const answer = wrenAnswer()
      await page.goto(`${WREN}/`, { waitUntil: 'networkidle' })
      await pause(page, 1200)
      // The desktop and the phone layouts each have their own message box.
      const box = page.locator('textarea:visible').first()
      await box.click()
      await typeSlowly(box, answer.prompt)
      await pause(page, 400)
      // The send button, not Enter: on a phone Enter starts a new line.
      await page.locator('[aria-label="Send message"]:visible').click()
      await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="answer"]')].at(-1)?.getAttribute('data-status') === 'done')
      await pause(page, 2600)
    },
  },
}

const board = storyboards[slug]
if (!board) throw new Error(`no storyboard for ${slug}`)
const device = phone
  ? { ...devices['iPhone 14'], viewport: SIZE, deviceScaleFactor: 2 }
  : { viewport: SIZE }
await board.seed?.()
const browser = await chromium.launch()
const signedIn = async (context) => {
  await board.prepare?.(context)
  if (slug !== 'openping') return
  // The local OpenPing's seeded admin session.
  await context.addCookies([{ name: 'op_session', value: SESSION, url: OPENPING, secure: true, httpOnly: true }])
  // The status feed is cacheable for 20 seconds; a visitor coming back later
  // would get it fresh, so the take asks for it fresh too.
  await context.route('**/api/public/**', (route) => route.continue({ headers: { ...route.request().headers(), 'cache-control': 'no-cache' } }))
}
// A first pass fills the browser cache, so the take shows pages, not loading.
const warm = await browser.newContext({ ...device, colorScheme: 'dark' })
await signedIn(warm)
const warmPage = await warm.newPage()
for (const url of board.warm) await warmPage.goto(url, { waitUntil: 'networkidle' })
const storage = await warm.storageState()
await warm.close()
const context = await browser.newContext({ ...device, recordVideo: { dir: outDir, size: SIZE }, storageState: storage, colorScheme: 'dark' })
await signedIn(context)
const page = await context.newPage()
const started = Date.now()
await board.play(page)
const video = page.video()
await context.close()
await browser.close()
const take = join(outDir, `${slug}${phone ? '-phone' : ''}-take.webm`)
renameSync(await video.path(), take)
console.log(`${slug}: ${((Date.now() - started) / 1000).toFixed(1)}s take at ${take}`)
