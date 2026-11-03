// Records Scribe's app tour as a real screen recording (round 5 of
// 2026-11-02; round 4's tour was a crossfade of stills): someone using the app
// with a visible cursor, from Scribe's real React UI with its Tauri backend
// mocked (mock-ipc.js) and sample data. Home, a dictation started with its
// Start button with the words appearing live, stopped and saved as the newest
// transcript, History, the Dictation, Words, Models and Hotkeys settings, then
// Appearance and a switch to the Emerald theme.
//
//   1. In the Scribe repo's app/ folder: npx vite --port 1477 --strictPort
//   2. node scripts/scribe-tour/record.mjs <framesDir>   (through ~/scripts/browser-slot)
//   3. scripts/scribe-tour/build.sh <framesDir>          (the video, its poster and stills)
//
// It records the page as it paints (Chrome's screencast, each frame with its
// time), so the app's own transitions play at their real speed. The cursor is
// an overlay drawn on top (overlay.js); every click is a real click on the
// app. The microphone is the mock's: the words are fed in as live text. 864x540 (16:10, above the app's 820x540 minimum) at 2x, in the
// app's Windows fonts when WSL can see them. Muted, no audio device: the video
// never has sound.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { windowsFonts } from './fonts.mjs'

const OUT = process.argv[2]
const BASE = process.env.SCRIBE_UI ?? 'http://localhost:1477/'
if (!OUT) throw new Error('usage: node scripts/scribe-tour/record.mjs <framesDir>')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const MOCK = fs.readFileSync(new URL('./mock-ipc.js', import.meta.url), 'utf8')
const OVERLAY = fs.readFileSync(new URL('./overlay.js', import.meta.url), 'utf8')

// The window's own 2x scale, not an emulated one: Chrome's screencast only
// sends frames at device pixels when the browser itself renders at 2x.
const browser = await chromium.launch({
  args: ['--mute-audio', '--force-device-scale-factor=2', '--window-size=864,540'],
  env: { ...process.env, PULSE_SERVER: 'unix:/nonexistent', ...windowsFonts() },
})
const page = await (await browser.newContext({ viewport: null })).newPage()
page.on('pageerror', (e) => console.error('page error:', e.message))
await page.addInitScript({ content: `window.__SCRIBE_SCENARIO={sounds:false};\n${MOCK}\n${OVERLAY}` })
await page.goto(BASE)
await page.locator('nav.nav-list').waitFor()
await page.evaluate(() => document.fonts.ready)
await page.mouse.move(700, 470)
await page.waitForTimeout(1500)

// The screencast: every painted frame, with its timestamp.
const frames = []
const cdp = await page.context().newCDPSession(page)
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = path.join(OUT, `${String(frames.length).padStart(5, '0')}.jpg`)
  frames.push({ file: path.basename(file), t: metadata.timestamp })
  fs.writeFileSync(file, Buffer.from(data, 'base64'))
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
const wait = (ms) => page.waitForTimeout(ms)
const cursor = (fn, ...args) => page.evaluate(([fn, args]) => window.__tour[fn](...args), [fn, args])

/** Glide the cursor to the middle of `locator` (or a point), then click it for real. */
async function clickOn(locator, { ms = 650, hold = 0 } = {}) {
  const box = await locator.boundingBox()
  const x = box.x + Math.min(box.width / 2, 60)
  const y = box.y + box.height / 2
  await cursor('moveTo', x, y, ms)
  await page.mouse.move(x, y)
  await wait(120)
  await cursor('press')
  await page.mouse.click(x, y)
  await wait(hold)
}
const navTo = (view) => page.locator('nav.nav-list button', { hasText: new RegExp(`^${view.replace('&', '\\&')}$`) })

await cursor('show', 700, 470)
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, everyNthFrame: 1 })
await wait(1600)

// Home: Start, and talk; the words arrive as you speak.
await clickOn(page.getByRole('button', { name: 'Start', exact: true }), { ms: 800, hold: 150 })
await page.evaluate(() => {
  window.__SCRIBE_SET_STATUS('Recording')
  window.__SCRIBE_EMIT('audio://recording-started', {
    sessionId: 's1',
    microphoneId: 'default',
    microphoneName: 'Realtek',
    sampleRate: 16000,
    channels: 1,
    startedAt: new Date().toISOString(),
    maxDurationMs: 600000,
    isTestClip: false,
    isNote: false,
  })
})
// The cursor drifts off the controls while you talk.
void cursor('moveTo', 640, 300, 900)
const said = 'So the plan for tomorrow is to finish the release notes, then ship the new build.'
const words = said.split(' ')
for (let i = 1; i <= words.length; i++) {
  await page.evaluate(
    ([text]) => {
      const level = 0.25 + Math.random() * 0.5
      window.__SCRIBE_EMIT('audio://level', { sessionId: 's1', level, peak: Math.min(1, level + 0.2), rms: level * 0.7 })
      window.__SCRIBE_EMIT('scribe:partial-transcript', { sessionId: 's1', text, segments: 1, finalized: false })
    },
    [words.slice(0, i).join(' ')],
  )
  await wait(i % 5 === 0 ? 330 : 230)
}
await wait(500)
// Stop: it finishes, and the words are the newest transcript.
await clickOn(page.getByRole('button', { name: 'Stop', exact: true }), { ms: 700 })
await page.evaluate(() => window.__SCRIBE_SET_STATUS('Transcribing'))
await wait(650)
await page.evaluate((text) => window.__SCRIBE_FINISH(text), said)
await cursor('moveTo', 470, 430, 700)
await wait(1500)

// History, then the settings, one after another.
await clickOn(navTo('History'), { hold: 2200 })
for (const view of ['Dictation', 'Words', 'Models & language', 'Hotkeys']) await clickOn(navTo(view), { ms: 520, hold: 1500 })
// Appearance, and a new theme applies at once.
await clickOn(navTo('Appearance'), { ms: 520, hold: 1100 })
await clickOn(page.getByText('Emerald', { exact: true }), { ms: 800, hold: 2200 })
// Back home in the new colours, where the loop starts over.
await clickOn(navTo('Home'), { ms: 800, hold: 1600 })

await cdp.send('Page.stopScreencast')
await wait(300)
const end = frames.at(-1).t + 0.1
fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ frames, end }, null, 1))
await browser.close()
console.log(`${frames.length} frames, ${(end - frames[0].t).toFixed(1)}s, in ${OUT}`)
