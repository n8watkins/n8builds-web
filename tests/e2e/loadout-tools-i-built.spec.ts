import { test, expect } from '@playwright/test'

/**
 * /loadout's "Tools I built and use" (the owner's calls, 2026-11-01): Scribe,
 * out of the homepage Lab's "My tools", leads it as the Lab's own full-bleed
 * row, then the small CLIs' cards. OpenPing went the other way, into the
 * Lab's Featured builds. The row's own behaviour (download, gallery, Full story)
 * is covered in lab.spec.ts, the cards in loadout-dev-tools.spec.ts.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test('/loadout has Tools I built and use: Scribe as a Lab row, then the CLIs, after the stacks', async ({ page }) => {
  await page.goto('/loadout')
  const part = page.getByRole('region', { name: 'Tools I built and use' })
  await expect(part.getByRole('heading', { level: 2 })).toHaveText('Tools I built and use')
  await expect(part).toContainText('~/loadout/built')
  await expect(part).toContainText('Tools I made for myself and use every day. All open source and MIT-licensed.')
  const scribe = part.getByRole('article', { name: 'Scribe' })
  await expect(scribe.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')
  // OpenPing is not here: it is a featured build in the homepage Lab.
  await expect(page.getByRole('article', { name: 'OpenPing' })).toHaveCount(0)
  // One part, not two: no separate "My daily drivers" or "Tools I built".
  const order = await page.locator('main h2').allTextContents()
  expect(order).not.toContain('My daily drivers')
  expect(order).not.toContain('Tools I built')
  expect(order.slice(order.indexOf('How I work with AI'), order.indexOf('Tools I use') + 1)).toEqual([
    'How I work with AI',
    'Inside the apps I build',
    'Stacks I build with',
    'Tools I built and use',
    'Tools I use',
  ])
  // People I follow moved to the homepage.
  await expect(page.getByRole('region', { name: 'People I follow' })).toHaveCount(0)
  await expect(page.locator('#people, #kun-chen')).toHaveCount(0)
})

for (const width of [1440, 810, 390]) {
  test(`at ${width}px Scribe's row lines up with the page's column, and its wash reaches the page edge`, { tag: width === 390 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/loadout')
    const part = page.locator('#tools-i-built')
    await part.scrollIntoViewIfNeeded()
    const [heading, title, wash, card, next] = await Promise.all([
      // A part's heading starts with its icon (2026-11-02).
      part.locator('[data-part-icon]').boundingBox(),
      part.getByRole('heading', { level: 3, name: 'Scribe' }).boundingBox(),
      part.getByRole('article', { name: 'Scribe' }).boundingBox(),
      part.getByRole('article', { name: 'pass-env' }).boundingBox(),
      page.locator('#tools-i-use [data-part-icon]').boundingBox(),
    ])
    // The row's text and the cards start with the part's heading and the next
    // part's (the Scribe icon sits left of its title, so the title starts further in).
    expect(Math.abs(heading!.x - next!.x)).toBeLessThan(1)
    expect(Math.abs(heading!.x - card!.x)).toBeLessThan(1)
    expect(title!.x).toBeGreaterThan(heading!.x)
    // The cards come after the row, under it.
    expect(card!.y).toBeGreaterThan(wash!.y + wash!.height - 1)
    // Full-bleed: the row's colour wash spans the page (the page's width, its
    // scrollbar gutter aside), without sideways scrolling.
    const main = (await page.locator('main').boundingBox())!
    expect(wash!.x).toBe(main.x)
    expect(Math.abs(wash!.width - main.width)).toBeLessThan(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
}

test('Tools I built and use is two groups, its cards the size and style of Tools I use\'s', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/loadout')
  const part = page.getByRole('region', { name: 'Tools I built and use' })
  // Round 3 of 2026-11-02: the dev tools (Scribe's row leads them); "Other things I built" left
  // with PR Post in round 5 (its one place is The Pull Request Post's card on the homepage).
  await expect(part.getByRole('heading', { level: 3 }).filter({ hasNotText: 'Scribe' })).toHaveText(['Dev tools I built'])
  const dev = part.getByRole('group', { name: 'Dev tools I built' })
  await expect(dev.getByRole('article', { name: 'Scribe' })).toHaveCount(1)
  await expect(dev.getByRole('heading', { level: 4 })).toHaveText([/^pass-env/, /^release-kit/, /^devguard/])
  await expect(part.getByRole('group', { name: 'Other things I built' })).toHaveCount(0)

  // The same card as Tools I use: padding, corners, border, background and icon size.
  const look = (el: Element) => {
    const s = getComputedStyle(el)
    const icon = el.querySelector('[aria-hidden="true"]')!.getBoundingClientRect()
    return { padding: s.padding, radius: s.borderTopLeftRadius, border: s.borderTopColor, bg: s.backgroundColor, icon: [icon.width, icon.height] }
  }
  const built = await part.getByRole('article', { name: 'pass-env' }).evaluate(look)
  const used = await page.locator('#tools-i-use li#herdr').evaluate(look)
  expect(built).toEqual(used)
  // The three dev tools share one row, as tall as each other.
  const boxes = await dev.getByRole('article').filter({ hasNot: page.getByRole('heading', { name: 'Scribe' }) }).evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
  )
  expect(boxes).toHaveLength(3)
  for (const box of boxes) {
    expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(1)
    expect(Math.abs(box.height - boxes[0].height)).toBeLessThan(1)
  }
})

test('old links land on Tools I built and use: the Lab\'s /#my-tools, and /loadout#daily-drivers', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/#my-tools')
  await expect(page).toHaveURL(/\/loadout#tools-i-built$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Tools I built and use' })).toBeInViewport()
  // "My daily drivers" was its own part for a day: its anchor still lands here.
  await page.goto('/loadout#daily-drivers')
  await expect(page.getByRole('heading', { level: 2, name: 'Tools I built and use' })).toBeInViewport()
})

test("the navbar's Lab menu lists Featured with OpenPing in it, and no My tools", async ({ page }) => {
  await page.goto('/loadout')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.locator('a[href="/#featured"]').first()).toContainText('OpenPing and Solara')
  await expect(nav.locator('a[href="/#my-tools"]')).toHaveCount(0)
})

test('on the homepage the Loadout comes right after People I follow, with no Tools band of its own', async ({ page }) => {
  await page.goto('/')
  const order = await page.evaluate(() => {
    const people = document.getElementById('people')!.closest('main > *')!
    return { next: people.nextElementSibling?.querySelector('#loadout') !== null }
  })
  expect(order.next, 'the band after People I follow holds the Loadout').toBe(true)
  // The tools are inside the Loadout section, not a section beside it.
  await expect(page.locator('#loadout #tools-i-built')).toHaveCount(1)
})
