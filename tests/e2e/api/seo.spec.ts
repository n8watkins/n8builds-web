import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * Search and share metadata for every page in the sitemap: a canonical URL, a
 * matching og:url, and a preview image that actually loads. Pages that set
 * their own openGraph replace the layout's entirely (Next.js merges metadata
 * shallowly), so this guards against a page silently losing its image.
 */

const SITE = 'https://n8builds.dev'

/** Map an absolute production URL onto the local test server. */
const local = (url: string) => url.replace(SITE, '')

function meta(html: string, attr: 'property' | 'name', key: string): string | undefined {
  const tag = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))
  return tag?.[1]
}

function canonical(html: string): string | undefined {
  return html.match(/<link rel="canonical" href="([^"]*)"/)?.[1]
}

async function sitemapUrls(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

/** PNG dimensions from the IHDR chunk. */
function pngSize(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString('ascii'), 'PNG signature').toBe('PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

test('every sitemap page has a canonical URL and a working preview image', async ({ request }) => {
  const urls = await sitemapUrls(request)
  expect(urls.length).toBeGreaterThan(5)
  const titles = new Map<string, string>()

  for (const url of urls) {
    const response = await request.get(local(url) || '/')
    expect(response.status(), url).toBe(200)
    const html = await response.text()

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
    expect(title, `${url} title`).toBeTruthy()
    expect(titles.get(title!), `${url} title is unique`).toBeUndefined()
    titles.set(title!, url)
    expect(meta(html, 'name', 'description'), `${url} description`).toBeTruthy()

    expect(canonical(html), `${url} canonical`).toBe(url)
    expect(meta(html, 'property', 'og:url'), `${url} og:url`).toBe(url)
    expect(meta(html, 'property', 'og:title'), `${url} og:title`).toBeTruthy()
    expect(meta(html, 'property', 'og:site_name'), `${url} og:site_name`).toBe('n8builds')

    const ogImage = meta(html, 'property', 'og:image')
    expect(ogImage, `${url} og:image`).toBeTruthy()
    expect(meta(html, 'name', 'twitter:image'), `${url} twitter:image`).toBe(ogImage)
    expect(meta(html, 'name', 'twitter:card'), `${url} twitter:card`).toBe('summary_large_image')

    // Only images served by this site can be checked locally.
    if (ogImage!.startsWith(SITE)) {
      const image = await request.get(local(ogImage!))
      expect(image.status(), `${url} og:image ${ogImage}`).toBe(200)
      expect(image.headers()['content-type'], `${url} og:image type`).toMatch(/^image\/(png|jpeg|webp)/)
    }
  }
})

test('a blog post with a generated cover gets its own 1200x630 PNG preview', async ({ request }) => {
  const post = (await sitemapUrls(request)).find((url) => url.includes('/blog/'))
  expect(post, 'sitemap lists at least one post').toBeTruthy()

  const html = await (await request.get(local(post!))).text()
  const ogImage = meta(html, 'property', 'og:image')!
  expect(ogImage).toBe(`${post}/og.png`)
  expect(meta(html, 'property', 'og:image:width')).toBe('1200')
  expect(meta(html, 'property', 'og:image:height')).toBe('630')
  expect(meta(html, 'property', 'og:type')).toBe('article')

  const image = await request.get(local(ogImage))
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toBe('image/png')
  expect(pngSize(await image.body())).toEqual({ width: 1200, height: 630 })
})

test('an unknown post has no preview image route', async ({ request }) => {
  const response = await request.get('/blog/no-such-post-anywhere/og.png')
  expect(response.status()).toBe(404)
})
