import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * The game pages' pictures and clips may be kept for a year (lib/media.ts), and
 * a clip answers byte ranges the way a cache would (worker/range.js).
 *
 * Where this runs decides what it proves:
 * - In the regular suite it runs against `next start`, which serves these files
 *   itself: it checks the pages point at content-hashed URLs and that Next keeps
 *   them, but never runs worker/range.js or OpenNext's image handler.
 * - CI's Cloudflare build job runs it against the built Worker under wrangler
 *   (`opennextjs-cloudflare preview`, E2E_WORKER=1, .github/workflows/ci.yml):
 *   that is what visitors get, and the tests marked "Worker" run only there.
 * worker/range.js's every branch is also pinned by tests/unit/workerRange.test.ts.
 */

const YEAR = 31_536_000
const WORKER = !!process.env.E2E_WORKER
const GAME = '/builds/n8games/tin-derby'

const maxAge = (cacheControl: string | undefined) => Number(/max-age=(\d+)/.exec(cacheControl ?? '')?.[1] ?? 0)

/** The page's first optimizer URL for one of its pictures, and its main clip. */
async function gameMedia(request: APIRequestContext) {
  const html = await (await request.get(GAME)).text()
  const picture = /\/_next\/image\?url=%2F_next%2Fstatic%2Fmedia%2Flap\.[\w-]+\.webp&amp;w=2048&amp;q=75/.exec(html)?.[0]
  const clip = /\/_next\/static\/media\/clip\.[\w-]+\.mp4/.exec(html)?.[0]
  expect(picture, 'a picture made from a content-hashed copy').toBeTruthy()
  expect(clip, 'a content-hashed clip').toBeTruthy()
  return { picture: picture!.replace(/&amp;/g, '&'), clip: clip! }
}

test('a game page points only at content-hashed pictures and clips', async ({ request }) => {
  const html = await (await request.get(GAME)).text()
  expect(html).not.toMatch(/"\/games\/n8games\/[^"]+\.(webp|mp4|webm)"/)
  expect(html).not.toMatch(/url=%2Fgames%2Fn8games%2F[^&"]+\.webp/)
})

test('a picture answer may be kept for a year', async ({ request }) => {
  const { picture } = await gameMedia(request)
  const response = await request.get(picture, { headers: { Accept: 'image/avif,image/webp,*/*' } })
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toMatch(/\bpublic\b/)
  expect(maxAge(response.headers()['cache-control'])).toBeGreaterThanOrEqual(YEAR)
})

test('a clip answers a range with 206 and the same Cache-Control, and a current copy with 304', async ({ request }) => {
  const { clip } = await gameMedia(request)
  const whole = await request.get(clip)
  expect(whole.status()).toBe(200)
  const cacheControl = whole.headers()['cache-control']
  expect(maxAge(cacheControl)).toBeGreaterThanOrEqual(YEAR)
  const etag = whole.headers()['etag']
  expect(etag).toBeTruthy()

  const part = await request.get(clip, { headers: { Range: 'bytes=0-99' } })
  expect(part.status()).toBe(206)
  expect(part.headers()['content-range']).toMatch(/^bytes 0-99\//)
  expect(part.headers()['cache-control']).toBe(cacheControl)

  const current = await request.get(clip, { headers: { Range: 'bytes=0-99', 'If-None-Match': etag } })
  expect(current.status()).toBe(304)
  expect((await current.body()).byteLength).toBe(0)
})

test.describe('Worker', () => {
  test.skip(!WORKER, 'only the built Worker runs worker/range.js (E2E_WORKER=1)')

  test('a range past the end is a bare 416, and a POST a 405', async ({ request }) => {
    const { clip } = await gameMedia(request)
    const refused = await request.get(clip, { headers: { Range: 'bytes=999999999-' } })
    expect(refused.status()).toBe(416)
    expect(refused.headers()['content-range']).toMatch(/^bytes \*\/\d+$/)
    for (const name of ['cache-control', 'etag', 'content-type']) expect(refused.headers()[name], name).toBeUndefined()

    const posted = await request.post(clip)
    expect(posted.status()).toBe(405)
    expect(posted.headers()['allow']).toBe('GET, HEAD')
  })

  test('a stale If-Range gets the whole clip', async ({ request }) => {
    const { clip } = await gameMedia(request)
    const response = await request.get(clip, { headers: { Range: 'bytes=0-99', 'If-Range': '"older"' } })
    expect(response.status()).toBe(200)
    expect(response.headers()['content-range']).toBeUndefined()
  })
})
