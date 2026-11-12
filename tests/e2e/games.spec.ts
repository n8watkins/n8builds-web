import { test, expect } from '@playwright/test'
import { GAMES } from '../../data/games'

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

test('the footer links /games', async ({ page }) => {
  await page.goto('/upcoming')
  const link = page.getByRole('contentinfo').getByRole('link', { name: 'Games', exact: true })
  await expect(link).toHaveAttribute('href', '/games')
})
