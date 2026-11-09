// Captures the screenshots a build page pairs with its features (owner,
// 2026-11-08), from the live product's public pages, at 1280x800, as WebP in
// public/builds/<slug>/. Public pages only: no sign-in, nothing saved.
//   node scripts/product-clips/shots.mjs <openping|solara>
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' })

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
}
await browser.close()
