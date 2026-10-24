import { test, expect } from '@playwright/test'

/**
 * The build log's search and share wiring: sitemap, structured data and the
 * share card. Runs against the recorded GitHub fixture (BUILD_LOG_FIXTURE=1).
 */

test('the sitemap lists the build log, dated by its newest entry', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const entry = xml.match(/<url>\s*<loc>https:\/\/n8builds\.dev\/builds<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/)
  expect(entry, '/builds in the sitemap with a lastmod').toBeTruthy()
  // The fixture's newest entry is Solara's work on 2026-10-23 (Los Angeles).
  expect(entry![1]).toMatch(/^2026-10-2[34]T/)
})

test('the build log describes its builds as an ItemList, most recently active first', async ({ request }) => {
  const html = await (await request.get('/builds')).text()
  const lists = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .filter((data) => data['@type'] === 'ItemList')
  expect(lists).toHaveLength(1)
  const items = lists[0].itemListElement as { position: number; name: string; url: string }[]
  expect(items.map((i) => i.position)).toEqual([1, 2, 3, 4, 5, 6])
  expect(items[0]).toMatchObject({ name: 'Solara', url: 'https://n8builds.dev/builds/solara' })
  expect(items.map((i) => i.url)).not.toContain('https://n8builds.dev/builds/vibelog')
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
  expect(html).toContain('Last shipped Oct 2026')
  expect(html).toContain('TL;DW 1.0 is packaged for the Chrome Web Store')
  expect(html).not.toContain('sync portfolios from upstream')
})
