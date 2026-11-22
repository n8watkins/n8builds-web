import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'
import { N8GAMES_PAGE, N8GAMES_URL, gamePage } from '../../data/n8games'
import { N8GAMES_GAMES } from '../../data/n8games/games'
import { HERO, PIECES } from '../../data/n8games/page'
import { hashedMedia, hashedMediaSelector } from './hashed-media'

/**
 * The n8games page (/builds/n8games) and a page per game under it
 * (owner, 2026-11-16): the clips, the links, the steps, the credits, the
 * pieces' stage, phone widths and reduced motion.
 */

/** A card's "How it's made" link: the words on it, then the game's name for a screen reader. */
const madeLink = (name: string) => new RegExp(`^How it's made\\s+for ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

const sideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

/** Waits until a video is really playing (its clock moves). */
async function expectPlaying(page: Page, selector: string) {
  await expect
    .poll(() => page.locator(selector).evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0), { timeout: 15_000 })
    .toBe(true)
}

/** Waits until the page's entrance has finished (every animation that ends has ended; the looping ones go on). */
async function settled(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)))
    .toBe(true)
}

test.describe('the n8games page', () => {
  test('one Go play, the moving room, the five games each to its own page, and the credits', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(N8GAMES_PAGE)
    await expect(page).toHaveTitle('n8games | n8builds')
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('n8games')
    await expect(main.getByRole('link', { name: 'Go play (opens in a new tab)' })).toHaveAttribute('href', N8GAMES_URL)

    // The hero clip: the wide crop on a computer, with its poster, playing by itself.
    const hero = main.locator('section').first().locator('video:visible')
    await expect(hero).toHaveCount(1)
    await expect(hero).toHaveAttribute('poster', hashedMedia(HERO.clip.wide.poster))
    await expect(hero.locator('source[type="video/webm"]')).toHaveAttribute('src', hashedMedia(HERO.clip.wide.webm))
    await expect(hero.locator('source[type="video/mp4"]')).toHaveAttribute('src', hashedMedia(HERO.clip.wide.mp4))
    await expect.poll(() => hero.evaluate((v: HTMLVideoElement) => !v.paused && v.muted)).toBe(true)
    await expect(main.getByRole('button', { name: 'Pause the clip of the party room' })).toBeVisible()

    // The shelf: five games, each card to its own page, "Playable" only on a game that is live.
    const shelf = page.locator('#games')
    for (const g of N8GAMES_GAMES) {
      const card = shelf.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name: g.name, exact: true }) })
      await expect(card.getByText(g.play.live ? 'Playable' : 'Coming soon', { exact: true })).toBeVisible()
      await expect(card.getByText(g.play.live ? 'Coming soon' : 'Playable', { exact: true })).toHaveCount(0)
      await expect(card.getByRole('link', { name: madeLink(g.name) })).toHaveAttribute('href', gamePage(g.slug))
    }

    // Make a game: the README, not setup steps.
    await expect(main.getByRole('link', { name: /Read the README/ })).toHaveAttribute('href', 'https://github.com/n8watkins/n8-party-games#how-a-game-gets-in')

    // Thanks: Nick Saraev as the repository credits him, with his links, and the sounds.
    await expect(main).toContainText('This project is not affiliated with Nick Saraev or endorsed by him.')
    for (const href of ['https://www.youtube.com/@nicksaraev', 'https://www.youtube.com/watch?v=wpFw66kKixU', 'https://www.youtube.com/watch?v=5mA9Hab09Do', 'https://www.skool.com/maker-zero/about']) {
      await expect(main.locator(`a[href="${href}"]`)).toHaveCount(1)
    }
    await expect(main.locator('a[href="https://kenney.nl/assets/interface-sounds"]')).toHaveCount(1)
    await main.getByText('Show all sound credits').click()
    await expect(main.locator('a[href^="https://freesound.org/people/"]')).toHaveCount(19)
  })

  test('the game cards lead to the game pages', async ({ page }) => {
    await page.goto(N8GAMES_PAGE)
    const link = page.getByRole('link', { name: madeLink('Cork & Bell') })
    // Once the shelf has risen into place: it fades up 40px as it scrolls into view, and a click
    // aimed while it still moved landed on the card beside the link (Firefox, 2026-11-22).
    await link.scrollIntoViewIfNeeded()
    const shelf = page.locator('section.reveal').filter({ has: link })
    await expect(shelf).toHaveAttribute('data-revealed', '')
    await shelf.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${gamePage('cork-and-bell')}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cork & Bell')
  })

  test('on a phone the hero clip is the taller crop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(N8GAMES_PAGE)
    const hero = page.getByRole('main').locator('section').first().locator('video:visible')
    await expect(hero).toHaveCount(1)
    await expect(hero).toHaveAttribute('poster', hashedMedia(HERO.clip.tall.poster))
  })

  test.describe('the pieces', () => {
    test('cycle by themselves, hover holds a piece, and the arrow keys move along the row', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(N8GAMES_PAGE)
      const row = page.getByRole('tablist', { name: 'The pieces' })
      await row.scrollIntoViewIfNeeded()
      const tabs = row.getByRole('tab')
      await expect(tabs).toHaveText(PIECES.map((p) => p.name))
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      // The stage plays the piece showing.
      await expectPlaying(page, '#piece-panel video[data-on="true"]')
      // By itself it moves on to the next piece after a few seconds.
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true', { timeout: 9_000 })

      // Hovering a piece shows it at once and holds it while the pointer stays.
      await tabs.nth(2).hover()
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
      await expect(page.locator('#piece-panel')).toContainText('From the real room')
      await expect(page.getByText('In the room now: it kicks like the pawn until its own move comes.')).toBeVisible()
      await page.waitForTimeout(6_500)
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
      await expectPlaying(page, '#piece-panel video[data-on="true"]')

      // The keyboard: the arrows move along the row, Home goes to the first.
      await tabs.nth(2).focus()
      await page.keyboard.press('ArrowRight')
      await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true')
      await expect(tabs.nth(3)).toBeFocused()
      await page.keyboard.press('ArrowRight')
      await expect(tabs.nth(0)).toBeFocused()
      await page.keyboard.press('End')
      await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('Home')
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    })

    test('with reduced motion they hold still, and Play plays the one showing', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(N8GAMES_PAGE)
      const row = page.getByRole('tablist', { name: 'The pieces' })
      await row.scrollIntoViewIfNeeded()
      const tabs = row.getByRole('tab')
      await page.waitForTimeout(6_500)
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      const clip = page.locator('#piece-panel video[data-on="true"]')
      await expect(clip).toHaveAttribute('poster', hashedMedia(PIECES[0].clip.poster))
      expect(await clip.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
      // A tap on a piece shows its still; Play plays it.
      await tabs.nth(1).click()
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
      await page.getByRole('button', { name: "Play the ghost's clip" }).click()
      await expectPlaying(page, '#piece-panel video[data-on="true"]')
    })
  })
})

test.describe('the game pages', () => {
  for (const g of N8GAMES_GAMES) {
    test(`${g.name}: its clip, pictures, steps, how it's made, links and credits`, async ({ page, request }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(gamePage(g.slug))
      await expect(page).toHaveTitle(`${g.name} | n8games | n8builds`)
      const main = page.getByRole('main')
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(g.name)
      // The `live` flag decides the chip: "Playable" only for a game on the live site.
      await expect(main.getByText(g.play.live ? 'Playable' : 'Coming soon', { exact: true })).toBeVisible()
      await expect(main.getByText(g.play.live ? 'Coming soon' : 'Playable', { exact: true })).toHaveCount(0)

      // The clip: muted, looping, inline, with its poster and both files, playing by itself.
      const clip = main.locator(`video${hashedMediaSelector('poster', g.clip.poster)}`)
      await expect(clip).toHaveCount(1)
      await expect(clip).toHaveAttribute('aria-label', g.clip.alt)
      await expect(clip).toHaveAttribute('poster', hashedMedia(g.clip.poster))
      await expect(clip.locator('source[type="video/webm"]:not([media])')).toHaveAttribute('src', hashedMedia(g.clip.webm))
      await expect(clip.locator('source[type="video/mp4"]:not([media])')).toHaveAttribute('src', hashedMedia(g.clip.mp4))
      // A computer never gets the phone encode.
      if (g.clip.phone) await expect.poll(() => clip.evaluate((v: HTMLVideoElement) => v.currentSrc)).toMatch(/\/clip\.[\w-]+\.(webm|mp4)$/)
      // Inline by its attribute: Firefox has no `playsInline` property (it never goes full screen by itself).
      expect(await clip.evaluate((v: HTMLVideoElement) => v.muted && v.loop && v.hasAttribute('playsinline'))).toBe(true)
      await expectPlaying(page, `video${hashedMediaSelector('poster', g.clip.poster)}`)
      // Once the page has come in: a click on a button still rising retries, and Playwright's
      // later tries scroll it to the top of the window, which takes the clip off screen, so the
      // clip pauses by itself and the button under the pointer has become Play (2026-11-21, WebKit).
      await settled(page)
      await main.getByRole('button', { name: `Pause the clip of ${g.name}` }).click()
      await expect.poll(() => clip.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)

      // Go play (twice: top and bottom) for a live game; for one that is not live, never Go
      // play, and the main button goes to the games site instead. Get the code only where the
      // code is public.
      const play = main.getByRole('link', { name: `Go play ${g.name} (opens in a new tab)` })
      const site = main.getByRole('link', { name: 'See the games site (opens in a new tab)' })
      await expect(play).toHaveCount(g.play.live ? 2 : 0)
      await expect(site).toHaveCount(g.play.live ? 0 : 2)
      for (const link of await play.all()) await expect(link).toHaveAttribute('href', g.play.href)
      for (const link of await site.all()) await expect(link).toHaveAttribute('href', N8GAMES_URL)
      if (!g.play.live) await expect(main.getByText('Go play', { exact: true })).toHaveCount(0)
      const code = main.getByRole('link', { name: `Get the code for ${g.name} (opens in a new tab)` })
      if (g.code) await expect(code.first()).toHaveAttribute('href', g.code)
      else await expect(code).toHaveCount(0)
      await expect(main.getByRole('link', { name: 'All of n8games' }).first()).toHaveAttribute('href', `${N8GAMES_PAGE}#games`)

      // How a round goes, how it's made (icons and short items), the credits.
      await expect(main.getByRole('list', { name: 'How a round goes' }).getByRole('listitem')).toHaveCount(g.steps.length)
      const made = main.getByRole('list', { name: "How it's made" }).getByRole('listitem')
      await expect(made).toHaveCount(g.made.length)
      await expect(made.locator('svg')).toHaveCount(g.made.length)
      for (const c of g.credits) {
        await expect(main.getByRole('heading', { level: 3, name: c.heading })).toBeVisible()
        for (const l of c.links) await expect(main.locator(`a[href="${l.href}"]`).first()).toBeAttached()
      }
      if (g.credits.some((c) => c.heading === 'Nick Saraev')) await expect(main).toContainText('This project is not affiliated with Nick Saraev or endorsed by him.')

      // The pictures load, with their words.
      for (const p of g.pictures) {
        const img = main.getByRole('img', { name: p.alt })
        await img.scrollIntoViewIfNeeded()
        await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
      }

      // Its share card.
      const og = await request.get(`${gamePage(g.slug)}/og.png`)
      expect(og.status()).toBe(200)
      expect(og.headers()['content-type']).toBe('image/png')
    })
  }

  test('reduced motion: a clip never plays by itself, and Play plays it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const g = N8GAMES_GAMES[0]
    await page.goto(gamePage(g.slug))
    const clip = page.locator(`video${hashedMediaSelector('poster', g.clip.poster)}`)
    await page.waitForTimeout(1_500)
    expect(await clip.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
    await page.getByRole('button', { name: `Play the clip of ${g.name}` }).click()
    await expectPlaying(page, `video${hashedMediaSelector('poster', g.clip.poster)}`)
  })

  test('an unknown game is a 404', async ({ request }) => {
    expect((await request.get(`${N8GAMES_PAGE}/no-such-game`)).status()).toBe(404)
    expect((await request.get('/builds/openping/cork-and-bell')).status()).toBe(404)
  })
})

for (const [width, height] of [
  [390, 844],
  [844, 390],
  [1280, 720],
] as const) {
  test(`at ${width}x${height} every game's name is one line, on a plate that wraps it tight`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    for (const g of N8GAMES_GAMES) {
      await page.goto(gamePage(g.slug))
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveText(g.name)
      await page.evaluate(() => document.fonts.ready)
      await expect.poll(() => h1.evaluate((el) => el.getAnimations().every((a) => a.playState === 'finished'))).toBe(true)
      const m = await h1.evaluate((el: HTMLElement) => {
        // Measured upright (the plate leans a little, Hot Potato's is slanted too).
        el.style.rotate = '0deg'
        el.style.transform = 'none'
        const cs = getComputedStyle(el)
        const range = document.createRange()
        range.selectNodeContents(el)
        const text = range.getBoundingClientRect()
        const lineHeight = parseFloat(cs.fontSize) * (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) || 1)
        const inner = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
        // The plate's width against its name's on one line, with the plate's padding and border.
        const natural = text.width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + (el.offsetWidth - el.clientWidth)
        el.style.rotate = ''
        el.style.transform = ''
        return { lines: Math.round(inner / lineHeight), width: el.offsetWidth, natural, room: el.parentElement!.clientWidth }
      })
      expect(m.lines, `${g.name}: lines`).toBe(1)
      expect(Math.abs(m.width - m.natural), `${g.name}: the plate is ${m.width}px for ${m.natural}px of name`).toBeLessThanOrEqual(3)
      expect(m.width, `${g.name}: fits its column`).toBeLessThanOrEqual(m.room)
    }
  })
}

test('on a phone, a game page\'s phone pictures scroll sideways and the keyboard can reach and scroll them', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const g = N8GAMES_GAMES.find((x) => x.pictures[0].height > x.pictures[0].width)!
  await page.goto(gamePage(g.slug))
  const strip = page.getByRole('region', { name: `Pictures of ${g.name}` })
  await strip.scrollIntoViewIfNeeded()
  expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await strip.focus()
  await expect(strip).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
})

test('on a phone the heaviest clips play their smaller phone encode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const g of N8GAMES_GAMES.filter((x) => x.clip.phone)) {
    await page.goto(gamePage(g.slug))
    const clip = page.locator(`video${hashedMediaSelector('poster', g.clip.poster)}`)
    await expect.poll(() => clip.evaluate((v: HTMLVideoElement) => v.currentSrc), { timeout: 15_000 }).toMatch(/\/clip-phone\.[\w-]+\.(webm|mp4)$/)
  }
})

test('on a phone the hero clip\'s Pause sits under the clip, not over it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(N8GAMES_PAGE)
  const clip = page.getByRole('main').locator('section').first().locator('video:visible')
  const pause = page.getByRole('button', { name: 'Pause the clip of the party room' }).locator('visible=true')
  const [v, b] = [await clip.boundingBox(), await pause.boundingBox()]
  expect(b!.y).toBeGreaterThanOrEqual(v!.y + v!.height)
})

for (const width of [390, 1280]) {
  test(`axe finds nothing serious at ${width}px on the n8games page and every game page`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 720 })
    for (const path of [N8GAMES_PAGE, ...N8GAMES_GAMES.map((g) => gamePage(g.slug))]) {
      await page.goto(path)
      // Every Reveal in: scroll through once.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(800)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((v) => `${path}: ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    }
  })
}

test.describe('the pictures and clips are cached', () => {
  test('every picture and clip on these pages comes from a content-hashed URL', async ({ page }) => {
    for (const path of [N8GAMES_PAGE, ...N8GAMES_GAMES.map((g) => gamePage(g.slug))]) {
      await page.goto(path)
      const urls = await page.getByRole('main').evaluate((main) => [
        ...[...main.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? ''),
        ...[...main.querySelectorAll('video')].map((video) => video.getAttribute('poster') ?? ''),
        ...[...main.querySelectorAll('video source')].map((source) => source.getAttribute('src') ?? ''),
      ])
      expect(urls.length, path).toBeGreaterThan(10)
      // Straight from /_next/static/media/, or made by the optimizer from there.
      const unhashed = urls.filter((url) => !decodeURIComponent(url).match(/^(\/_next\/image\?url=)?\/_next\/static\/media\//))
      expect(unhashed, path).toEqual([])
    }
  })

  // Their headers (a year, 206 and 304 for the clips) are tests/e2e/api/media-cache.spec.ts,
  // which CI also runs against the built Worker.
})

for (const width of [390, 768]) {
  test(`no sideways scroll at ${width}px on the n8games page and every game page`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    for (const path of [N8GAMES_PAGE, ...N8GAMES_GAMES.map((g) => gamePage(g.slug))]) {
      await page.goto(path)
      expect(await sideways(page), path).toBeLessThanOrEqual(0)
    }
  })
}
