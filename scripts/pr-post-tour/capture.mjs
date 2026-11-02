// Captures the frames of The Pull Request Post's tour (round 5 of
// 2026-11-02): its live front page (n8watkins.github.io/pr-post) scrolled
// from the masthead to the box scores and back up, at 24 frames a second.
// Each frame sets the scroll position and every CSS animation's clock (the
// ticker) by hand, then screenshots, so the motion is smooth and the same on
// every run however slow the machine. Muted Chromium, no audio anywhere.
//
//   node scripts/pr-post-tour/capture.mjs <framesDir>
//   scripts/pr-post-tour/build.sh <framesDir>
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const out = process.argv[2]
if (!out) throw new Error('usage: capture.mjs <framesDir>')
mkdirSync(out, { recursive: true })

const FPS = 24
// Seconds: hold on the masthead, scroll down, hold on the box scores, scroll back up (to the first frame).
const HOLD_TOP = 1.4
const DOWN = 7
const HOLD_BOTTOM = 1.4
const UP = 2.2
const total = HOLD_TOP + DOWN + HOLD_BOTTOM + UP
const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const browser = await chromium.launch({ args: ['--mute-audio', '--hide-scrollbars'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'no-preference' })
await page.goto('https://n8watkins.github.io/pr-post/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
// No caret, no hover state; the page's own smooth scrolling off, so each frame lands exactly.
await page.addStyleTag({ content: '*{caret-color:transparent!important}html{scroll-behavior:auto!important}' })
await page.mouse.move(-10, -10)
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()))

const frames = Math.round(total * FPS)
for (let i = 0; i < frames; i++) {
  const s = i / FPS
  let y = 0
  if (s < HOLD_TOP) y = 0
  else if (s < HOLD_TOP + DOWN) y = max * ease((s - HOLD_TOP) / DOWN)
  else if (s < HOLD_TOP + DOWN + HOLD_BOTTOM) y = max
  else y = max * (1 - ease((s - HOLD_TOP - DOWN - HOLD_BOTTOM) / UP))
  await page.evaluate(
    ([y, ms]) => {
      window.scrollTo(0, Math.round(y))
      document.getAnimations().forEach((a) => {
        a.currentTime = ms
      })
    },
    [y, s * 1000],
  )
  await page.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.png` })
}
console.log(`${frames} frames (${total}s) in ${out}; page scrolls ${max}px`)
await browser.close()
