import { test, expect } from '@playwright/test'
import { GAMES } from '../../data/games'
import { N8GAMES_AD, N8GAMES_PAGE, N8GAMES_URL } from '../../data/n8games'
import { HERO } from '../../data/n8games/page'

/**
 * /games: one card per playable game, each with its picture, a line, its tags
 * and a Play button to the game itself. The footer links the page.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test('lists every game with a Play button to the game, and is titled for the site', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/games')
  await expect(page).toHaveTitle('Games | n8builds')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Take a break, play something')

  const cards = page.locator('main article')
  await expect(cards).toHaveCount(GAMES.length)
  for (const [i, game] of GAMES.entries()) {
    const card = cards.nth(i)
    await expect(card.getByRole('heading', { level: 2 })).toHaveText(game.name)
    for (const tag of game.tags) await expect(card.getByRole('listitem').filter({ hasText: tag }).first()).toBeVisible()
    const play = card.getByRole('link', { name: new RegExp(`^${game.cta ?? 'Play'}: ${game.name.replace(/[?]/g, '\\?')}`) })
    await expect(play).toHaveAttribute('href', game.href)
    // A game on another site opens in a new tab; the homepage dino stays in this one.
    if (game.href.startsWith('http')) await expect(play).toHaveAttribute('target', '_blank')
    else await expect(play).not.toHaveAttribute('target', /.+/)
  }
})

test('every card picture loads', async ({ page }) => {
  await page.goto('/games')
  const images = page.locator('main article img')
  await expect(images).toHaveCount(GAMES.length * 2 - GAMES.filter((g) => !g.icon.startsWith('/')).length)
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  }
})

test('n8games card leads to its build page and shows the real room, not the ad\'s render again', async ({ page }) => {
  await page.goto('/games')
  const card = page.locator('main article#n8games')
  await expect(card.getByRole('img', { name: HERO.clip.posterAlt })).toBeVisible()
  await expect(card.getByRole('img', { name: N8GAMES_AD.image.alt })).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Learn more about n8games' })).toHaveAttribute('href', N8GAMES_PAGE)
})

for (const [path, id] of [
  ['/games', 'n8games-feature'],
  ['/', 'n8games-ad'],
] as const) {
  test(`the n8games ad on ${path}: the render, Play to the games site and Learn more to the build page`, async ({ page }) => {
    await page.goto(path)
    const ad = page.locator(`section#${id}`)
    await ad.scrollIntoViewIfNeeded()
    await expect(ad.getByRole('heading', { level: 2 })).toHaveText(N8GAMES_AD.heading)
    const img = ad.getByRole('img', { name: N8GAMES_AD.image.alt })
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
    const play = ad.getByRole('link', { name: 'Play n8games (opens in a new tab)' })
    await expect(play).toHaveAttribute('href', N8GAMES_URL)
    await expect(play).toHaveAttribute('target', '_blank')
    await expect(ad.getByRole('link', { name: 'Learn more about n8games' })).toHaveAttribute('href', N8GAMES_PAGE)
  })
}

test('the n8games ad keeps its frame while the picture loads: the whole room from 640px, the close crop on a phone', async ({ page }) => {
  for (const [width, ratio, file] of [
    [390, 16 / 10, 'room-action'],
    [1280, 2, 'room-wide'],
  ] as const) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/games')
    const img = page.locator('section#n8games-feature img')
    const box = await img.boundingBox()
    expect(box, `${width}px`).not.toBeNull()
    // At 1280 the words sit beside the picture and may make the row a little taller than 2:1.
    if (width < 1024) expect(Math.abs(box!.width / box!.height - ratio), `${width}px`).toBeLessThan(0.02)
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain(file)
  }
})

test('the footer links /games', async ({ page }) => {
  await page.goto('/upcoming')
  const link = page.getByRole('contentinfo').getByRole('link', { name: 'Games', exact: true })
  await expect(link).toHaveAttribute('href', '/games')
})
