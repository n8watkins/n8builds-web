// Records a short clip of a build in use, from its live public pages, for its
// build page's header (owner, 2026-11-08). Playwright drives a real browser
// through a storyboard and saves the take; encode.sh trims, scales and
// compresses it into public/builds/<slug>/clip.{webm,mp4} and its poster.
//   node scripts/product-clips/record.mjs <openping|solara> <outDir>
// Public pages only: OpenPing's landing page and free tools, Solara's app as a
// guest. No sign-in, nothing saved anywhere.
import { chromium } from '@playwright/test'
import { mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const [slug, outDir] = process.argv.slice(2)
if (!slug || !outDir) throw new Error('usage: record.mjs <openping|solara> <outDir>')
mkdirSync(outDir, { recursive: true })

const SIZE = { width: 1280, height: 800 }
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

/** Types like a person, a key at a time. */
const typeSlowly = (locator, text) => locator.pressSequentially(text, { delay: 70 })

const storyboards = {
  // The landing page, its features, then a free tool answering a real question.
  openping: {
    warm: ['https://openping.n8builds.dev/', 'https://openping.n8builds.dev/tools/is-it-down'],
    async play(page) {
      await page.goto('https://openping.n8builds.dev/', { waitUntil: 'networkidle' })
      await pause(page, 1400)
      await glide(page, 900, 1800)
      await pause(page, 700)
      await page.goto('https://openping.n8builds.dev/tools/is-it-down', { waitUntil: 'networkidle' })
      await pause(page, 600)
      const input = page.getByRole('textbox').first()
      await input.click()
      await input.fill('')
      await typeSlowly(input, 'n8builds.dev')
      await page.getByRole('button', { name: 'Check' }).click()
      await pause(page, 2600)
    },
  },
  // A guest's first minute: the city, the skin type, the day's UV, then a run's lower-UV window.
  solara: {
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
}

const board = storyboards[slug]
if (!board) throw new Error(`no storyboard for ${slug}`)
const browser = await chromium.launch()
// A first pass fills the browser cache, so the take shows pages, not loading.
const warm = await browser.newContext({ viewport: SIZE })
const warmPage = await warm.newPage()
for (const url of board.warm) await warmPage.goto(url, { waitUntil: 'networkidle' })
const storage = await warm.storageState()
await warm.close()
const context = await browser.newContext({ viewport: SIZE, recordVideo: { dir: outDir, size: SIZE }, storageState: storage, colorScheme: 'dark' })
const page = await context.newPage()
const started = Date.now()
await board.play(page)
const video = page.video()
await context.close()
await browser.close()
renameSync(await video.path(), join(outDir, `${slug}-take.webm`))
console.log(`${slug}: ${((Date.now() - started) / 1000).toFixed(1)}s take in ${outDir}`)
