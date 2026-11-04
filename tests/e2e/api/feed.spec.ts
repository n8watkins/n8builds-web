import { test, expect } from '@playwright/test'

/**
 * The N8's Notions feed: valid RSS with every post on /blog, full text and
 * working links, and advertised by every page for reader auto-discovery.
 */

const SITE = 'https://n8builds.dev'

test('the feed lists every post on /blog with its full text', async ({ request }) => {
  const response = await request.get('/blog/rss.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/rss+xml')
  const xml = await response.text()

  expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/)
  expect(xml).toContain(`<atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />`)

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1])
  const blog = await (await request.get('/blog')).text()
  const posts = new Set([...blog.matchAll(/href="\/blog\/([^"/?#]+)"/g)].map((m) => m[1]).filter((s) => s !== 'rss.xml'))
  expect(items.length).toBeGreaterThan(0)
  expect(items.length).toBe(posts.size)

  for (const item of items) {
    const link = item.match(/<link>([^<]+)<\/link>/)?.[1]
    expect(link, 'item link').toMatch(new RegExp(`^${SITE}/blog/`))
    expect(posts.has(link!.replace(`${SITE}/blog/`, '')), `${link} is on /blog`).toBe(true)
    expect(item).toMatch(/<pubDate>\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/)
    expect(item, `${link} has its full text`).toMatch(/<content:encoded><!\[CDATA\[<p>/)
    const page = await request.get(link!.replace(SITE, ''))
    expect(page.status(), link).toBe(200)
  }
})

test('pages advertise the feed for auto-discovery', async ({ request }) => {
  for (const path of ['/', '/blog']) {
    const html = await (await request.get(path)).text()
    const link = html.match(/<link rel="alternate" type="application\/rss\+xml"[^>]*>/)?.[0]
    expect(link, `${path} has a feed link`).toBeTruthy()
    expect(link).toContain(`href="${SITE}/blog/rss.xml"`)
    expect(link).toContain('title="N8&#x27;s Notions"')
  }
})
