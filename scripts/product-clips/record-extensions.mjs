// Records the Chrome extensions' clips for the homepage's Extensions part
// (owner, 2026-11-09): each the real extension, loaded unpacked into a
// throwaway browser profile, driven through a known-good demo with nothing
// live that could make a take flaky. Each take is a CDP screencast of one tab
// at 1280x800 and deviceScaleFactor 2 (2560x1600 frames), so the camera can
// zoom 2x and stay sharp, and it logs where each focus target was and when
// (getBoundingClientRect, CSS px). It writes:
//   <out>/<slug>/take.mkv     the take, at 24 fps, with the slow parts cut
//   <out>/<slug>/shots.json   the camera keys for camera.mjs, in take seconds
// then: node camera.mjs shots.json take.mkv camera.mkv && encode.sh <slug> camera.mkv 0-<end>
//
//   node scripts/product-clips/record-extensions.mjs <tldw|voicedock|tubevault> <outDir>
//
// TL;DW: its "your own Gemini key" path. A dummy key ("demo-key") goes in
// before the take, and every call to Gemini is answered by the browser from
// fixtures/tldw-gemini.json (a real summary of the same video), so nothing
// reaches Google. YouTube itself is the real page.
// VoiceDock: its local voices (Piper on 127.0.0.1:7477 and Kokoro on 7478 must
// be running), on a real n8builds.dev post.
// TubeVault: its native helper is registered only inside the throwaway profile
// (<profile>/NativeMessagingHosts, which Chromium on Linux reads from the
// user data dir; nothing system-wide), and it downloads a Creative Commons
// video (Blender's Big Buck Bunny, CC BY) into a scratch folder that is
// deleted afterwards with the profile.
//
// EXT_DIR overrides where the extensions live (default ~/projects/extensions);
// CLIP_PATH is put first on the browser's PATH (and so the helper's), e.g. a
// folder holding a current yt-dlp.
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const [slug, outRoot] = process.argv.slice(2)
if (!slug || !outRoot) throw new Error('usage: record-extensions.mjs <tldw|voicedock|tubevault> <outDir>')
const EXT_DIR = process.env.EXT_DIR ?? join(homedir(), 'projects/extensions')
const out = join(outRoot, slug)
rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'frames'), { recursive: true })
const profile = join(out, 'profile')

const VIEW = { width: 1280, height: 800 }
const DSF = 2
const FPS = 24

const EXTENSIONS = {
  tldw: join(EXT_DIR, 'tldw/dist'),
  voicedock: join(EXT_DIR, 'voicedock/extension'),
  tubevault: join(EXT_DIR, 'tube-vault/extension'),
}
const ext = EXTENSIONS[slug]
if (!ext) throw new Error(`unknown extension ${slug}`)

const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: VIEW,
  deviceScaleFactor: DSF,
  colorScheme: 'dark',
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--mute-audio'],
  // TubeVault's helper keeps its small state files here, not in ~/.local/state. CLIP_PATH
  // goes first on its PATH: a folder with a current yt-dlp, when the installed one is
  // too old for YouTube (it then fails with HTTP 403).
  env: {
    ...process.env,
    XDG_STATE_HOME: join(out, 'state'),
    PATH: [process.env.CLIP_PATH, process.env.PATH].filter(Boolean).join(':'),
  },
})
let [worker] = ctx.serviceWorkers()
if (!worker) worker = await ctx.waitForEvent('serviceworker')
const extId = new URL(worker.url()).host
const pause = (ms) => new Promise((r) => setTimeout(r, ms))

// --- The take: a screencast of one tab, with a log of focus targets. ----------
const frames = []
let stoppedAt = 0
const events = []
const cuts = []
let t0 = 0
let cdp = null
const now = () => Date.now() - t0
async function startTake(page) {
  cdp = await ctx.newCDPSession(page)
  t0 = Date.now()
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push({ t: now(), data: f.data })
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: VIEW.width * DSF, maxHeight: VIEW.height * DSF })
}
async function switchTake(page) {
  await cdp.send('Page.stopScreencast')
  cdp.removeAllListeners('Page.screencastFrame')
  cdp = await ctx.newCDPSession(page)
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push({ t: now(), data: f.data })
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: VIEW.width * DSF, maxHeight: VIEW.height * DSF })
}
/** Logs a camera key: the box of a target (or the whole frame) at this moment. */
async function shot(name, box) {
  events.push({ t: now(), name, box: box ?? null })
}
async function boxOf(locator) {
  const b = await locator.boundingBox()
  return b && { x: b.x, y: b.y, w: b.width, h: b.height }
}
/** Marks the stretch from now until `end()` to be cut from the take (a wait). */
function cutFrom() {
  const from = now()
  return () => cuts.push([from, now()])
}

// --- The demos. ----------------------------------------------------------------
async function tldw() {
  const fixture = JSON.parse(readFileSync(join(here, 'fixtures/tldw-gemini.json'), 'utf8'))
  // Every Gemini call is answered here, from the fixture; nothing reaches Google.
  // The summary arrives after a steady 1.6s, about what a real one takes.
  await ctx.route('https://generativelanguage.googleapis.com/**', async (route) => {
    const url = route.request().url()
    if (url.includes(':generateContent')) {
      await pause(1600)
      return route.fulfill({ json: fixture.generateContent })
    }
    if (route.request().method() === 'GET') return route.fulfill({ json: fixture.model })
    return route.fulfill({ status: 404, json: { error: { message: 'not in the fixture' } } })
  })
  // Before the take: "demo-key" in TL;DW's key field (masked), saved and verified (by the route).
  const options = await ctx.newPage()
  await options.goto(`chrome-extension://${extId}/src/options/index.html#directapi`).catch(() => {})
  await options.waitForTimeout(800)
  const settings = await worker.evaluate(() => chrome.storage.local.get('settings'))
  const keyField = options.locator('input[type="password"]').first()
  if (await keyField.isVisible().catch(() => false)) {
    await keyField.fill('demo-key')
    await options.getByRole('button', { name: 'Save key' }).click()
    await options.waitForTimeout(1500)
  } else {
    // The options page moved: set the same settings the key form saves, then verify.
    await worker.evaluate(async (s) => {
      await chrome.storage.local.set({ settings: { ...(s.settings ?? {}), geminiApiKey: 'demo-key', geminiApiKeyName: 'Demo key', geminiKeyValidation: { status: 'unverified' } } })
    }, settings)
  }
  // The form verifies the key itself (the route answers); wait for its verdict.
  let after = {}
  for (let i = 0; i < 40; i++) {
    after = await worker.evaluate(() => chrome.storage.local.get('settings'))
    if (after.settings?.geminiKeyValidation?.status !== 'unverified') break
    await pause(250)
  }
  if (!after.settings?.useDirectApi) throw new Error(`TL;DW did not switch to the key path: ${JSON.stringify({ v: after.settings?.geminiKeyValidation, d: after.settings?.useDirectApi, k: !!after.settings?.geminiApiKey })}`)
  await options.close()

  const video = fixture.videoId
  // A first visit warms YouTube (and its consent) before the take.
  const warm = await ctx.newPage()
  await warm.goto(`https://www.youtube.com/watch?v=${video}`, { waitUntil: 'domcontentloaded' })
  await warm.waitForTimeout(5000)
  await warm.close()
  for (const p of ctx.pages()) if (!p.url().includes('youtube')) await p.close().catch(() => {})

  const page = await ctx.newPage()
  await page.goto(`https://www.youtube.com/watch?v=${video}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await page.evaluate(() => document.querySelector('video')?.pause())
  const btn = page.locator('#tldw-watch-btn')
  await btn.scrollIntoViewIfNeeded()
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2)
  await startTake(page)
  await shot('page')
  await page.waitForTimeout(1200)
  const b = (await boxOf(btn))
  await shot('page')
  // The press stays wide: the panel opens above the button and pushes it down.
  await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2, { steps: 25 })
  await page.waitForTimeout(500)
  await btn.click()
  await page.locator('#tldw-summary').waitFor({ timeout: 30000 })
  await page.waitForFunction(() => (document.querySelector('#tldw-summary')?.textContent || '').length > 60, null, { timeout: 30000 })
  await page.waitForTimeout(400)
  await page.evaluate(() => document.querySelector('#tldw-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await page.waitForTimeout(900)
  // The panel: TL;DW's summary right under the video.
  const summary = await boxOf(page.locator('#tldw-summary'))
  await shot('summary-wide', { x: summary.x - 16, y: summary.y - 60, w: summary.w + 32, h: summary.h + 90 })
  await page.waitForTimeout(1600)
  // Read along: the camera closes in on the start of the summary, then pans to its end.
  await shot('summary-start', { x: summary.x - 8, y: summary.y - 8, w: summary.w * 0.5, h: summary.h + 16 })
  await page.waitForTimeout(900)
  await shot('summary-start', { x: summary.x - 8, y: summary.y - 8, w: summary.w * 0.5, h: summary.h + 16 })
  await page.waitForTimeout(3600)
  await shot('summary-end', { x: summary.x + summary.w * 0.5, y: summary.y - 8, w: summary.w * 0.5 + 8, h: summary.h + 16 })
  await page.waitForTimeout(1200)
  await shot('summary-end', { x: summary.x + summary.w * 0.5, y: summary.y - 8, w: summary.w * 0.5 + 8, h: summary.h + 16 })
  await page.waitForTimeout(900)
  await shot('page')
  await page.waitForTimeout(1000)
}

async function voicedock() {
  // Three profiles across both local engines; the take picks Kokoro's, then Piper's.
  await worker.evaluate(() =>
    chrome.storage.local.set({
      profiles: [
        { id: 'stories', name: 'Stories', engine: 'kokoro', voice: 'af_heart', rate: 1.0, volume: 1 },
        { id: 'articles', name: 'Articles', engine: 'piper', voice: 'en_US-ryan-high.onnx', rate: 1.1, volume: 1 },
        { id: 'british', name: 'British', engine: 'kokoro', voice: 'bf_emma', rate: 1.0, volume: 1 },
      ],
      activeId: 'british',
    }),
  )
  // Warm both voices so the take never waits on a model load.
  for (const [port, voice] of [[7477, 'en_US-ryan-high.onnx'], [7478, 'af_heart']]) {
    await fetch(`http://127.0.0.1:${port}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Warm up.', voice }) }).catch(() => {})
  }

  // 1. The popup, in a tab of its own (a real popup window can't be screencast).
  const popup = await ctx.newPage()
  // Closing every tab would close the browser: the others go once this one is open.
  for (const p of ctx.pages()) if (p !== popup) await p.close().catch(() => {})
  await popup.goto(`chrome-extension://${extId}/popup.html`)
  await popup.addStyleTag({ content: 'html, body { background: #11111b; } body { margin: 48px auto; width: max-content; }' })
  await popup.waitForTimeout(1500)
  const app = popup.locator('.app')
  await popup.mouse.move(VIEW.width / 2, VIEW.height - 40)
  await startTake(popup)
  await shot('page')
  await popup.waitForTimeout(700)
  const appBox = await boxOf(app)
  await shot('popup', appBox)
  await popup.waitForTimeout(900)
  const card = await boxOf(popup.locator('.profile-card'))
  await shot('voices', { x: card.x, y: card.y - 10, w: card.w, h: card.h + 20 })
  const next = popup.getByTitle('Next profile')
  const nb = await boxOf(next)
  await popup.mouse.move(nb.x + nb.w / 2, nb.y + nb.h / 2, { steps: 20 })
  // British (Kokoro, Emma) -> Stories (Kokoro, Heart) -> Articles (Piper, Ryan).
  for (const wait of [1300, 1500]) {
    await popup.waitForTimeout(wait)
    await next.click()
  }
  await popup.waitForTimeout(1100)
  await shot('voices', { x: card.x, y: card.y - 10, w: card.w, h: card.h + 20 })
  await shot('popup', appBox)
  await popup.waitForTimeout(1000)
  // Pull back before the cut, so the post opens wide.
  await shot('page')
  await popup.waitForTimeout(1100)

  // 2. A real n8builds.dev post: select two paragraphs and read them. Its load is cut.
  const endCut = cutFrom()
  const page = await ctx.newPage()
  const worlds = []
  const pageCdp = await ctx.newCDPSession(page)
  pageCdp.on('Runtime.executionContextCreated', (e) => worlds.push(e.context))
  await pageCdp.send('Runtime.enable')
  await page.goto('https://n8builds.dev/blog/why-i-build-in-public', { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '[data-consent], #consent-banner { display: none !important }' }).catch(() => {})
  const para = page.locator('article p').nth(1)
  const after = page.locator('article p').nth(2)
  await para.evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 160))
  await page.waitForTimeout(1200)
  await switchTake(page)
  endCut()
  await shot('page')
  const b = await boxOf(para)
  const e = await boxOf(after)
  await page.mouse.move(b.x - 2, b.y + 6, { steps: 15 })
  await page.mouse.down()
  await page.mouse.move(e.x + e.w * 0.6, e.y + e.h - 6, { steps: 35 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const w = worlds.filter((c) => c.auxData?.type === 'isolated' && c.name === 'VoiceDock').pop()
  await pageCdp.send('Runtime.evaluate', { contextId: w.id, expression: "chrome.runtime.sendMessage({ type: 'keyboard-read', text: getSelection().toString() })" })
  // The player bar, in a closed shadow root: its box through the DevTools protocol.
  let bar = null
  for (let i = 0; i < 40 && !bar; i++) {
    await page.waitForTimeout(150)
    bar = await closedBox(pageCdp, 'bar').catch(() => null)
  }
  if (!bar) throw new Error('no player bar')
  await shot('page')
  await page.waitForTimeout(1200)
  await shot('bar', { x: bar.x - 40, y: bar.y - 30, w: bar.w + 80, h: bar.h + 60 })
  // Pause from the corner, then play again: the bar keeps reading.
  const pp = await closedBox(pageCdp, 'btn-pp')
  await page.mouse.move(pp.x + pp.w / 2, pp.y + pp.h / 2, { steps: 25 })
  await page.waitForTimeout(700)
  await page.mouse.click(pp.x + pp.w / 2, pp.y + pp.h / 2)
  await page.waitForTimeout(1300)
  // "Paused" is narrower than "Playing", so the button moved: find it again.
  const play = await closedBox(pageCdp, 'btn-pp')
  await page.mouse.move(play.x + play.w / 2, play.y + play.h / 2, { steps: 6 })
  await page.mouse.click(play.x + play.w / 2, play.y + play.h / 2)
  await page.waitForTimeout(2600)
  await shot('bar', { x: bar.x - 40, y: bar.y - 30, w: bar.w + 80, h: bar.h + 60 })
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2, { steps: 20 })
  await shot('page')
  await page.waitForTimeout(2200)
}

/** The box (CSS px) of the first element with a class, closed shadow roots included. */
async function closedBox(session, className) {
  const { root } = await session.send('DOM.getDocument', { depth: -1, pierce: true })
  const stack = [root]
  while (stack.length) {
    const n = stack.pop()
    const cls = n.attributes?.[(n.attributes?.indexOf('class') ?? -2) + 1]
    if (cls && cls.split(' ').includes(className)) {
      const { model } = await session.send('DOM.getBoxModel', { nodeId: n.nodeId })
      const [x1, y1, x2, , , y3] = model.border
      return { x: x1, y: y1, w: x2 - x1, h: y3 - y1 }
    }
    stack.push(...(n.children ?? []), ...(n.shadowRoots ?? []), ...(n.contentDocument ? [n.contentDocument] : []))
  }
  return null
}

async function tubevault() {
  const repo = join(EXT_DIR, 'tube-vault')
  // The helper, registered for this profile only: Chromium on Linux reads
  // <user data dir>/NativeMessagingHosts, so nothing system-wide changes.
  const hosts = join(profile, 'NativeMessagingHosts')
  mkdirSync(hosts, { recursive: true })
  const launcher = join(repo, 'scripts/run-helper.sh')
  chmodSync(launcher, 0o755)
  writeFileSync(
    join(hosts, 'com.tube_vault.helper.json'),
    JSON.stringify({ name: 'com.tube_vault.helper', description: 'TubeVault local archive helper', path: launcher, type: 'stdio', allowed_origins: [`chrome-extension://${extId}/`] }, null, 2),
  )
  const downloads = join(out, 'downloads')
  mkdirSync(downloads, { recursive: true })
  await tubevaultSetup(downloads)
  const video = 'aqz-KE-bpKQ' // Blender's Big Buck Bunny: "Creative Commons Attribution license (reuse allowed)"
  const warm = await ctx.newPage()
  await warm.goto(`https://www.youtube.com/watch?v=${video}`, { waitUntil: 'domcontentloaded' })
  await warm.waitForTimeout(5000)
  await warm.close()
  for (const p of ctx.pages()) if (!p.url().includes('youtube')) await p.close().catch(() => {})
  const page = await ctx.newPage()
  await page.goto(`https://www.youtube.com/watch?v=${video}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await page.evaluate(() => document.querySelector('video')?.pause())
  await tubevaultTake(page, downloads)
  // A real file came down: list it for the log, then it goes with the take's folder.
  console.log('downloaded:', execFileSync('find', [downloads, '-type', 'f', '-size', '+100k'], { encoding: 'utf8' }).trim())
}

async function tubevaultSetup(downloads) {
  // Downloads go to the take's scratch folder; no notifications or folder pop-ups.
  await worker.evaluate(
    (root) => chrome.storage.local.set({ outputRoot: root, outputRootSeeded: true, notifyOnDone: false, autoOpenFolder: false }),
    downloads,
  )
}

async function tubevaultTake(page, downloads) {
  // TubeVault's red Download button, beside YouTube's own actions.
  const button = page.locator('button[title="Download"]').first()
  await button.waitFor({ timeout: 20000 })
  await button.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2)
  await startTake(page)
  await shot('page')
  await page.waitForTimeout(1000)
  const b = await boxOf(button)
  await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2, { steps: 25 })
  await page.waitForTimeout(300)
  await button.click()
  // Its menu: pick Video at 360p, then Download.
  // The menu is the panel holding "Select All" (portalled to the end of the body).
  const menu = page.locator('button', { hasText: /^(Select|Deselect) All$/ }).locator('..')
  await menu.waitFor()
  await page.waitForTimeout(300)
  const m = await boxOf(menu)
  await shot('menu', { x: Math.min(m.x, b.x) - 12, y: Math.min(m.y, b.y) - 12, w: Math.max(m.x + m.w, b.x + b.w) - Math.min(m.x, b.x) + 24, h: Math.max(m.y + m.h, b.y + b.h) - Math.min(m.y, b.y) + 24 })
  await page.waitForTimeout(1200)
  const video = menu.getByText('Video', { exact: true })
  const v = await boxOf(video)
  await page.mouse.move(v.x + v.w / 2, v.y + v.h / 2, { steps: 15 })
  await video.click()
  await page.waitForTimeout(700)
  await menu.locator('select').first().selectOption('360')
  await page.waitForTimeout(900)
  const go = menu.locator('button', { hasText: /^Download$/ })
  const g = await boxOf(go)
  await page.mouse.move(g.x + g.w / 2, g.y + g.h / 2, { steps: 15 })
  await page.waitForTimeout(300)
  await go.click()
  // It asks first, with what it will fetch and its size: confirm.
  const confirm = page.getByText('Download this video?').locator('..')
  await confirm.waitFor({ timeout: 20000 })
  await page.waitForTimeout(400)
  await shot('confirm', await boxOf(confirm))
  await page.waitForTimeout(1500)
  const yes = confirm.getByRole('button', { name: 'Download' })
  const y = await boxOf(yes)
  await page.mouse.move(y.x + y.w / 2, y.y + y.h / 2, { steps: 15 })
  await page.waitForTimeout(300)
  await yes.click()
  // Queued: its toast says so, and points at the toolbar icon.
  const toast = page.getByText(/^Added 1 video to downloads/)
  await toast.waitFor({ timeout: 20000 })
  await page.waitForTimeout(300)
  const tb = await boxOf(toast)
  await shot('toast', { x: tb.x - 40, y: tb.y - 30, w: tb.w + 80, h: tb.h + 60 })
  await page.waitForTimeout(2400)
  await shot('page')
  await page.waitForTimeout(1000)

  // The toolbar popup (in a tab of its own: a real popup window can't be screencast):
  // the download running, then done. The long middle is cut.
  const endLoad = cutFrom()
  const popup = await ctx.newPage()
  await popup.goto(`chrome-extension://${extId}/popup.html`)
  await popup.addStyleTag({ content: 'html, body { background: #0f0f0f; } body { margin: 48px auto; width: max-content; }' })
  await popup.waitForTimeout(800)
  await switchTake(popup)
  endLoad()
  await shot('page')
  const panel = await boxOf(popup.locator('#root > *').first())
  await popup.waitForTimeout(600)
  await shot('popup', panel)
  await popup.waitForTimeout(3600)
  const endCut = cutFrom()
  const done = () => {
    try {
      return execFileSync('find', [downloads, '-name', '*.mp4', '-size', '+1M'], { encoding: 'utf8' }).trim().length > 0
    } catch {
      return false
    }
  }
  for (let i = 0; i < 600 && !done(); i++) await popup.waitForTimeout(500)
  if (!done()) throw new Error('the download never finished')
  await popup.waitForTimeout(1500)
  endCut()
  await popup.waitForTimeout(300)
  await shot('popup', await boxOf(popup.locator('#root > *').first()))
  await popup.waitForTimeout(2800)
  await shot('page')
  await popup.waitForTimeout(1500)
}

try {
  if (slug === 'tldw') await tldw()
  else if (slug === 'voicedock') await voicedock()
  else await tubevault()
} finally {
  // A screencast sends a frame only when something repaints, so a still ending is
  // held from the last frame until now.
  stoppedAt = now()
  if (cdp) await cdp.send('Page.stopScreencast').catch(() => {})
  await ctx.close()
  // TubeVault's profile (with its helper registration) and the downloaded file are left
  // for the caller to move to the trash once the take is checked; the others go now.
  if (slug !== 'tubevault') rmSync(profile, { recursive: true, force: true })
}

// --- The take on disk, at a steady 24 fps, with the cut stretches taken out. ------------------
const kept = frames.filter((f) => !cuts.some(([a, b]) => f.t > a && f.t < b))
const shift = (t) => cuts.reduce((s, [a, b]) => (t >= b ? s + (b - a) : s), 0)
const start = kept[0].t
const takeT = (t) => (t - shift(t) - start) / 1000
kept.forEach((f, i) => writeFileSync(join(out, 'frames', `${String(i).padStart(5, '0')}.jpg`), Buffer.from(f.data, 'base64')))
const list = kept
  .map((f, i) => {
    const next = kept[i + 1]
    const dur = next ? takeT(next.t) - takeT(f.t) : takeT(stoppedAt) - takeT(f.t)
    return `file 'frames/${String(i).padStart(5, '0')}.jpg'\nduration ${Math.max(0.001, dur).toFixed(4)}`
  })
  .join('\n')
writeFileSync(join(out, 'frames.txt'), `${list}\nfile 'frames/${String(kept.length - 1).padStart(5, '0')}.jpg'\n`)
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(out, 'frames.txt'), '-vf', `fps=${FPS},scale=${VIEW.width * DSF}:${VIEW.height * DSF},format=yuv420p`, '-c:v', 'libx264', '-preset', 'ultrafast', '-qp', '0', join(out, 'take.mkv')], { cwd: out })
const end = takeT(stoppedAt)
// The camera's keys: from each logged moment it eases to that target over 0.9s, then holds.
const MOVE = 0.9
const keys = []
for (const ev of events) {
  const t = Math.max(0, takeT(ev.t))
  const last = keys.at(-1)
  const box = ev.box ?? undefined
  if (!last) keys.push({ t, box, name: ev.name })
  else if (JSON.stringify(last.box) !== JSON.stringify(box)) {
    const from = Math.max(t, last.t)
    keys.push({ t: from, box: last.box, name: last.name }, { t: from + MOVE, box, name: ev.name })
  }
}
keys.push({ t: Math.max(end, keys.at(-1).t + 0.5), box: keys.at(-1)?.box, name: 'end' })
writeFileSync(join(out, 'shots.json'), JSON.stringify({ source: { width: VIEW.width * DSF, height: VIEW.height * DSF }, scale: DSF, output: VIEW, maxZoom: 2.2, keys }, null, 2))
console.log(`${slug}: ${kept.length} frames, ${end.toFixed(2)}s, ${keys.length} camera keys -> ${out}`)
