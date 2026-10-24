import { test, expect } from '@playwright/test'

/**
 * /api/live and the /live share link, against the server's fake live mode
 * (LIVE_TEST_MODE=1 in playwright.config.ts; the scenario comes from the
 * `n8-live-test` cookie).
 */

const as = (scenario: string) => ({ headers: { cookie: `n8-live-test=${scenario}` } })

test.describe('/api/live', () => {
  test('answers offline by default, uncached in test mode', async ({ request }) => {
    const response = await request.get('/api/live')
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toBe('no-store')
    expect(await response.json()).toMatchObject({ live: false, streams: [], preferred: null })
  })

  for (const [scenario, platforms] of [
    ['twitch', ['twitch']],
    ['youtube', ['youtube']],
    ['both', ['twitch', 'youtube']],
    ['x', ['x']],
    ['none', []],
  ] as const) {
    test(`scenario ${scenario}`, async ({ request }) => {
      const body = await (await request.get('/api/live', as(scenario))).json()
      expect(body.live).toBe(platforms.length > 0)
      expect(body.streams.map((s: { platform: string }) => s.platform)).toEqual(platforms)
      expect(body.preferred).toBe(platforms[0] ?? null)
    })
  }
})

test.describe('/live', () => {
  for (const [scenario, location] of [
    ['twitch', 'https://twitch.tv/n8watkins'],
    ['youtube', 'https://www.youtube.com/watch?v=n8LiveTest1'],
    // Live on both: the preferred platform, Twitch.
    ['both', 'https://twitch.tv/n8watkins'],
    ['x', 'https://x.com/n8watkins/status/1850000000000000000'],
  ] as const) {
    test(`redirects to the stream when live (${scenario})`, async ({ request }) => {
      const response = await request.get('/live', { ...as(scenario), maxRedirects: 0 })
      expect(response.status()).toBe(307)
      expect(response.headers()['location']).toBe(location)
    })
  }

  test('lists the channels while offline', async ({ request }) => {
    const response = await request.get('/live', { ...as('none'), maxRedirects: 0 })
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain('Not live right now')
    expect(html).toContain('href="https://twitch.tv/n8watkins"')
    expect(html).toContain('href="https://x.com/n8watkins"')
    expect(html).toContain('Next stream')
    expect(html).toContain('<link rel="canonical" href="https://n8builds.dev/live"')
  })
})
