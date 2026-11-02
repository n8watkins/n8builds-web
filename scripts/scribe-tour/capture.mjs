// Captures the scenes of Scribe's app tour (the video in its row on /loadout
// and the homepage's Loadout) from Scribe's real React UI, with its Tauri
// backend mocked (mock-ipc.js) and sample data. Nothing here is drawn by hand:
// every frame is the app's own UI.
//
//   1. In the Scribe repo's app/ folder: npx vite --port 1477 --strictPort
//   2. node scripts/scribe-tour/capture.mjs <scenesDir>   (through ~/scripts/browser-slot)
//   3. scripts/scribe-tour/build.sh <scenesDir>           (the video, its poster and stills)
//
// The window is 864x540 (16:10, the row's frame; above the app's 820x540
// minimum) at 2x. On WSL the app's own Windows fonts (Segoe UI Variable,
// Cascadia) come from C:\Windows\Fonts, so the text looks as it does on Windows.
import { chromium } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const OUT = process.argv[2]
const BASE = process.env.SCRIBE_UI ?? 'http://localhost:1477/'
if (!OUT) throw new Error('usage: node scripts/scribe-tour/capture.mjs <scenesDir>')
fs.mkdirSync(OUT, { recursive: true })
const MOCK = fs.readFileSync(new URL('./mock-ipc.js', import.meta.url), 'utf8')

/** A fontconfig that adds the Windows fonts the app asks for, when they are there. */
function windowsFonts() {
  const winFonts = '/mnt/c/Windows/Fonts'
  if (!fs.existsSync(winFonts)) return {}
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scribe-tour-fonts-'))
  const names = ['SegUIVar.ttf', 'segoeui.ttf', 'segoeuib.ttf', 'seguisb.ttf', 'CascadiaCode.ttf', 'CascadiaMono.ttf', 'consola.ttf']
  fs.mkdirSync(path.join(dir, 'fonts'))
  for (const name of names) if (fs.existsSync(path.join(winFonts, name))) fs.copyFileSync(path.join(winFonts, name), path.join(dir, 'fonts', name))
  const conf = path.join(dir, 'fonts.conf')
  fs.writeFileSync(
    conf,
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${dir}/fonts</dir><cachedir>${dir}/cache</cachedir></fontconfig>`,
  )
  return { FONTCONFIG_FILE: conf }
}

// No sound, ever: muted, and no audio device.
const browser = await chromium.launch({ args: ['--mute-audio'], env: { ...process.env, PULSE_SERVER: 'unix:/nonexistent', ...windowsFonts() } })
const page = await browser.newPage({ viewport: { width: 864, height: 540 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.error('page error:', e.message))
await page.addInitScript({ content: `window.__SCRIBE_SCENARIO={};\n${MOCK}` })

const load = async () => {
  await page.goto(BASE)
  await page.locator('nav.nav-list').waitFor()
  await page.waitForTimeout(1200)
  // The pointer out of the way, so nothing shows a hover.
  await page.mouse.move(0, 539)
}
let n = 0
const shot = async (name) => {
  n++
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, `${String(n).padStart(2, '0')}-${name}.png`) })
}
const nav = async (view) => {
  await page.locator('nav.nav-list button', { hasText: new RegExp(`^${view.replace('&', '\\&')}$`) }).click()
  await page.mouse.move(0, 539)
  await page.waitForTimeout(400)
}

await load()
await shot('home')
// Dictating: the app's own recording state, with live text as you talk.
await page.evaluate(() => {
  window.__SCRIBE_SET_STATUS('Recording')
  window.__SCRIBE_EMIT('audio://recording-started', {
    sessionId: 's1',
    microphoneId: 'default',
    microphoneName: 'Realtek',
    sampleRate: 16000,
    channels: 1,
    startedAt: new Date(Date.now() - 6000).toISOString(),
    maxDurationMs: 600000,
    isTestClip: false,
    isNote: false,
  })
  window.__SCRIBE_EMIT('audio://level', { sessionId: 's1', level: 0.55, peak: 0.8, rms: 0.4 })
  window.__SCRIBE_EMIT('scribe:partial-transcript', {
    sessionId: 's1',
    text: 'So the plan for tomorrow is to finish the release notes and',
    segments: 1,
    finalized: false,
  })
})
await shot('home-recording')
// A fresh load: idle again, without the recording's toast.
await load()
for (const view of ['History', 'Dictation', 'Words', 'Models & language', 'Hotkeys', 'Local AI', 'Appearance']) {
  await nav(view)
  await shot(view.toLowerCase().replace(/\W+/g, '-'))
}
// A theme change applies at once.
await page.getByText('Emerald', { exact: true }).click()
await page.mouse.move(0, 539)
await shot('appearance-emerald')
await browser.close()
console.log(`${n} scenes in ${OUT}`)
