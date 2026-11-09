import { test, expect } from '@playwright/test'

/**
 * The header's hovers (owner, round 8 of 2026-11-09), CSS only: techforpros.com's
 * curved underline shows nothing at rest and draws in on hover or keyboard focus,
 * and the Portfolio button's briefcase gives a small shake. Under reduced motion
 * the underline just appears and the briefcase holds still.
 */
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`techforpros.com's underline draws in on hover, and Portfolio's briefcase shakes (${reducedMotion})`, async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion, viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    await page.goto('/')
    const tfp = page.locator('[data-nav-techforpros]')
    const line = tfp.locator('.tfp-underline path')
    const look = () => line.evaluate((p) => ({ offset: parseFloat(getComputedStyle(p).strokeDashoffset), opacity: getComputedStyle(p).opacity }))
    // Nothing at rest.
    expect(await look()).toEqual({ offset: 101, opacity: '0' })
    await tfp.hover()
    if (reducedMotion === 'no-preference') {
      // Drawing in: part of the way along soon after the hover, then whole.
      await expect.poll(async () => (await look()).offset).toBeLessThan(101)
    } else {
      // No transition: whole at once.
      expect(await line.evaluate((p) => getComputedStyle(p).transitionDuration)).toBe('0s')
    }
    await expect.poll(look).toEqual({ offset: 0, opacity: '1' })
    // Keyboard focus draws it too.
    await page.mouse.move(0, 400)
    await expect.poll(async () => (await look()).opacity).toBe('0')
    await page.keyboard.press('Tab')
    await tfp.focus()
    await expect.poll(async () => (await look()).opacity).toBe('1')

    const briefcase = page.locator('nav a:has(.nav-briefcase)').first().locator('.nav-briefcase')
    expect(await briefcase.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
    await page.locator('nav a:has(.nav-briefcase)').first().hover()
    expect(await briefcase.evaluate((el) => getComputedStyle(el).animationName)).toBe(
      reducedMotion === 'reduce' ? 'none' : 'nav-briefcase-shake',
    )
    await context.close()
  })
}
