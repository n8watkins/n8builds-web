// Captures the screenshots a build page pairs with its features (owner,
// 2026-11-08), from the live product's public pages, at 1280x800, as WebP in
// public/builds/<slug>/. Public pages only: no sign-in, nothing saved.
//   node scripts/product-clips/shots.mjs <openping|solara|wren>
// Wren's chat shot asks its one recorded question, replayed (wren-replay.mjs).
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { replayWren, WREN, wrenAnswer } from './wren-replay.mjs'

const slug = process.argv[2]
const OUT = join(import.meta.dirname, '../../public/builds', slug)
const work = mkdtempSync(join(tmpdir(), 'shots-'))

/** Scrolls an element to the top of the window (under any sticky header) and takes the window. */
async function shoot(page, name, locator, offset = 0) {
  if (locator) {
    await locator.first().evaluate((el, offset) => scrollTo(0, el.getBoundingClientRect().top + scrollY - offset), offset)
    await page.waitForTimeout(700)
  }
  const png = join(work, `${name}.png`)
  await page.screenshot({ path: png })
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '80', join(OUT, `${name}.webp`)])
  console.log(`${slug}/${name}.webp`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' })
// Wren as a first-time guest, so the welcome dialog and the free-demo notice show.
if (slug === 'wren') await replayWren(context, { returning: false })
const page = await context.newPage()

if (slug === 'openping') {
  await page.goto('https://openping.n8builds.dev/', { waitUntil: 'networkidle' })
  await shoot(page, 'features', page.locator('#features'), 72)
  await shoot(page, 'schedule-aware', page.locator('#schedule-aware'), 72)
  await shoot(page, 'free-plan', page.locator('#free-plan'), 72)
  await page.goto('https://openping.n8builds.dev/tools/is-it-down', { waitUntil: 'networkidle' })
  const input = page.getByRole('textbox').first()
  await input.fill('n8builds.dev')
  await page.getByRole('button', { name: 'Check' }).click()
  await page.getByText(/It's up|It's down/).first().waitFor()
  await shoot(page, 'is-it-down')
} else if (slug === 'solara') {
  await page.goto('https://solara-uv.web.app/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Not now' }).click().catch(() => {})
  await page.getByPlaceholder(/Type a city/).fill('Sydney')
  await page.getByRole('button', { name: 'Go' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /Medium/ }).click()
  await page.waitForTimeout(500)
  await shoot(page, 'app-skin-type')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: "See today's plan" }).click()
  await page.waitForTimeout(2500)
  await shoot(page, 'app-uv-today')
  await page.getByRole('button', { name: '+ Add activity' }).click()
  await page.getByRole('dialog').getByText('Running', { exact: true }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await page.waitForTimeout(2000)
  await shoot(page, 'app-activity-window')
  await page.getByRole('button', { name: /Vitamin D log/ }).click()
  await page.waitForTimeout(1200)
  await shoot(page, 'app-vitamin-d')
  await page.goto('https://solara-uv.web.app/es/', { waitUntil: 'networkidle' })
  await shoot(page, 'landing-es')
} else if (slug === 'wren') {
  // A first visit as a guest: "How Wren works", then the free-demo notice over the composer.
  await page.goto(`${WREN}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shoot(page, 'how-it-works')
  await page.getByRole('button', { name: 'Start chatting' }).click()
  await page.waitForTimeout(600)
  await shoot(page, 'demo-notice')
  await page.locator('[data-testid="demo-dismiss"]:visible').click()
  // The recorded question, its answer read from the top once it is all in.
  await page.locator('textarea:visible').first().fill(wrenAnswer().prompt)
  await page.locator('[aria-label="Send message"]:visible').click()
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="answer"]')].at(-1)?.getAttribute('data-status') === 'done')
  await page.getByTestId('thread').evaluate((el) => el.scrollTo(0, 0))
  await page.waitForTimeout(600)
  await shoot(page, 'chat')
  await page.locator('a.nav[href="/memory"]').click()
  await page.getByRole('heading', { name: 'Your memory' }).waitFor()
  await page.waitForTimeout(600)
  await shoot(page, 'memory')
}
await browser.close()
