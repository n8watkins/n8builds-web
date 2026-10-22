import { test, expect } from '@playwright/test'

/**
 * The "Currently building" carousel cycles every 7s. It must not shift the page
 * as it does, and must not move content out from under a keyboard user.
 */

test.use({ contextOptions: { reducedMotion: 'no-preference' }, viewport: { width: 390, height: 844 } })

test('swapping cards never changes the card height', async ({ page }) => {
  await page.goto('/')
  const now = page.locator('#now')
  await now.scrollIntoViewIfNeeded()
  const heights = new Set<number>()
  for (let i = 0; i < 4; i++) {
    heights.add(Math.round((await now.boundingBox())!.height))
    await now.getByRole('button', { name: 'Next' }).click()
  }
  expect([...heights]).toHaveLength(1)
})

test('rotation stops while focus is inside, and on request', async ({ page }) => {
  await page.goto('/')
  const now = page.locator('#now')
  await now.scrollIntoViewIfNeeded()
  const active = now.locator('[aria-hidden="false"]')
  const first = await active.innerText()

  // Focus a link in the visible card and outlast one cycle.
  await active.getByRole('link').first().focus()
  await page.waitForTimeout(8_000)
  await expect(active.getByRole('link').first()).toBeFocused()
  expect(await active.innerText()).toBe(first)

  // The pause button also holds it, with focus elsewhere.
  await now.getByRole('button', { name: 'Pause rotation' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.waitForTimeout(8_000)
  expect(await active.innerText()).toBe(first)
  await expect(now.getByRole('button', { name: 'Resume rotation' })).toBeVisible()
})
