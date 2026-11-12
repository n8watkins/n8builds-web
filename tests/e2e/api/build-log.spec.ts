import { test, expect } from '@playwright/test'

/**
 * The build log's search and share wiring: sitemap, structured data and the
 * share card. Runs against the recorded GitHub fixture (BUILD_LOG_FIXTURE=1).
 */

test('the sitemap lists the build log, dated by its newest entry', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const entry = xml.match(/<url>\s*<loc>https:\/\/n8builds\.dev\/builds<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/)
  expect(entry, '/builds in the sitemap with a lastmod').toBeTruthy()
  // The fixture's newest entry is this site's own work on 2026-10-26 (Los Angeles).
  expect(entry![1]).toMatch(/^2026-10-2[67]T/)
})

test('the build log describes its builds as an ItemList, most recently active first', async ({ request }) => {
  const html = await (await request.get('/builds')).text()
  const lists = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .filter((data) => data['@type'] === 'ItemList')
  expect(lists).toHaveLength(1)
  const items = lists[0].itemListElement as { position: number; name: string; url: string }[]
  // The builds (the developer portfolio's page since round 12 of 2026-11-09), then the projects the log follows without a build page (round 5 of
  // 2026-11-02, data/logBuilds.ts; Who Am I?, Pivot and FitFlow 7 joined in round 7), each
  // linking where the site shows it.
  expect(items.map((i) => i.position)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
  for (const slug of ['whoami', 'pivot', 'fitflow7']) expect(items.map((i) => i.url)).toContain(`https://n8builds.dev/upcoming#${slug}`)
  expect(items.map((i) => i.url)).toContain('https://n8builds.dev/upcoming#feelium')
  expect(items[0]).toMatchObject({ name: 'n8builds.dev', url: 'https://n8builds.dev/builds/n8builds' })
  expect(items[1]).toMatchObject({ name: 'Solara', url: 'https://n8builds.dev/builds/solara' })
  // Nothing that left the site (2026-11-11): no Wren page, and no card of a removed upcoming project.
  for (const gone of ['/builds/wren', '/builds/vibelog', '/upcoming#strollz', '/upcoming#keysready', '/upcoming#vibelog']) {
    expect(items.map((i) => i.url)).not.toContain(`https://n8builds.dev${gone}`)
  }
})

test('the build log shares its own 1200x630 card', async ({ request }) => {
  const html = await (await request.get('/builds')).text()
  expect(html).toContain('<meta property="og:image" content="https://n8builds.dev/builds/og.png"')
  expect(html).toContain('<title>The build log | n8builds</title>')

  const image = await request.get('/builds/og.png')
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toBe('image/png')
  const bytes = await image.body()
  expect({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }).toEqual({ width: 1200, height: 630 })
})

test('the build log is server-rendered: the index and the feed are in the HTML', async ({ request }) => {
  const html = await (await request.get('/builds')).text()
  // "Last shipped <span>Oct 2026</span>" on the most recently active card.
  expect(html).toMatch(/Last shipped <span[^>]*>Oct 2026<\/span>/)
  expect(html).toContain('TL;DW 1.0 is packaged for the Chrome Web Store')
  expect(html).not.toContain('sync portfolios from upstream')
})

test('the build log months are public JSON: the card figures and day bars, newest month first', async ({ request }) => {
  const response = await request.get('/builds/months.json')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')
  // Read by the owner's portfolio from another origin.
  expect(response.headers()['access-control-allow-origin']).toBe('*')
  const body = (await response.json()) as {
    version: number
    url: string
    months: { id: string; title: string; changes: number; days: { day: string; count: number; future?: boolean }[] }[]
  }
  expect(body.version).toBe(1)
  expect(body.url).toBe('https://n8builds.dev/builds')
  expect(body.months.length).toBeGreaterThan(1)
  for (const month of body.months) {
    expect(month.title).toMatch(/^([A-Z][a-z]+ \d{4}|Last 30 days)$/)
    // The headline is the bars' total, as on the card.
    expect(month.changes).toBe(month.days.reduce((n, d) => n + d.count, 0))
    expect(month.days.length).toBeGreaterThanOrEqual(28)
  }
  // Newest first: each later month is an earlier `YYYY-MM`.
  const ids = body.months.slice(1).map((m) => m.id)
  expect(ids).toEqual([...ids].sort().reverse())
})
