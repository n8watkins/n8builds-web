import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { MAX_SIGNATURE_AGE_MS, pathsForPayload, sanityTag, tagsForPayload, verifySanitySignature } from '@/lib/sanity-revalidate'

const SECRET = 'test-webhook-secret'
const NOW = Date.UTC(2026, 10, 4, 12, 0, 0)
const BODY = JSON.stringify({ _id: 'abc', _type: 'post', slug: 'hello' })

/** Sanity's header, made independently of @sanity/webhook: HMAC-SHA256 of "<t>.<body>", base64url. */
function sign(body: string, t = NOW, secret = SECRET) {
  const mac = createHmac('sha256', secret).update(`${t}.${body}`).digest('base64url')
  return `t=${t},v1=${mac}`
}

describe('verifySanitySignature', () => {
  it('accepts a body signed with the secret', async () => {
    expect(await verifySanitySignature(BODY, sign(BODY), SECRET, NOW)).toEqual({ ok: true })
  })

  it('accepts a delivery up to five minutes old', async () => {
    const t = NOW - MAX_SIGNATURE_AGE_MS
    expect(await verifySanitySignature(BODY, sign(BODY, t), SECRET, NOW)).toEqual({ ok: true })
  })

  it('refuses a missing or malformed header', async () => {
    expect(await verifySanitySignature(BODY, null, SECRET, NOW)).toEqual({ ok: false, reason: 'missing' })
    expect(await verifySanitySignature(BODY, 'v1=abc', SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' })
    expect(await verifySanitySignature(BODY, 't=abc,v1=x', SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' })
  })

  it('refuses a replayed delivery older than five minutes, or one from the future', async () => {
    const old = NOW - MAX_SIGNATURE_AGE_MS - 1
    expect(await verifySanitySignature(BODY, sign(BODY, old), SECRET, NOW)).toEqual({ ok: false, reason: 'stale' })
    const future = NOW + MAX_SIGNATURE_AGE_MS + 1
    expect(await verifySanitySignature(BODY, sign(BODY, future), SECRET, NOW)).toEqual({ ok: false, reason: 'stale' })
  })

  it('refuses another secret, a changed body and a changed timestamp', async () => {
    expect(await verifySanitySignature(BODY, sign(BODY, NOW, 'other'), SECRET, NOW)).toEqual({ ok: false, reason: 'invalid' })
    const tampered = BODY.replace('hello', 'other')
    expect(await verifySanitySignature(tampered, sign(BODY), SECRET, NOW)).toEqual({ ok: false, reason: 'invalid' })
    const moved = sign(BODY).replace(`t=${NOW}`, `t=${NOW + 1}`)
    expect(await verifySanitySignature(BODY, moved, SECRET, NOW)).toEqual({ ok: false, reason: 'invalid' })
  })

  it('refuses an empty body', async () => {
    expect(await verifySanitySignature('', `t=${NOW},v1=abc`, SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' })
  })
})

describe('tagsForPayload', () => {
  it('maps each document type the site reads to its tag', () => {
    expect(tagsForPayload({ _type: 'post', slug: 'x' })).toEqual(['sanity:post'])
    expect(tagsForPayload({ _type: 'page' })).toEqual(['sanity:page'])
    expect(tagsForPayload({ _type: 'logEntry' })).toEqual(['sanity:logEntry'])
    expect(sanityTag('post')).toBe('sanity:post')
  })

  it('expires nothing for other types or a malformed body', () => {
    expect(tagsForPayload({ _type: 'liveStatus' })).toEqual([])
    expect(tagsForPayload({ _type: 'sanity.imageAsset' })).toEqual([])
    expect(tagsForPayload(null)).toEqual([])
    expect(tagsForPayload('post')).toEqual([])
    expect(tagsForPayload({})).toEqual([])
  })
})

describe('pathsForPayload', () => {
  it('warms the post, its card, the index, the homepage, the feed and the sitemap for a post', () => {
    expect(pathsForPayload({ _type: 'post', slug: 'hello-world' })).toEqual([
      '/blog',
      '/blog/hello-world',
      '/blog/hello-world/og.png',
      '/',
      '/blog/rss.xml',
      '/sitemap.xml',
    ])
  })

  it('still warms the lists for a post without a usable slug', () => {
    expect(pathsForPayload({ _type: 'post', slug: null })).toEqual(['/blog', '/', '/blog/rss.xml', '/sitemap.xml'])
    expect(pathsForPayload({ _type: 'post', slug: '../../admin' })).toEqual(['/blog', '/', '/blog/rss.xml', '/sitemap.xml'])
  })

  it('warms the build log and the build page for a highlight', () => {
    expect(pathsForPayload({ _type: 'logEntry', build: 'scribe' })).toEqual(['/builds', '/builds/scribe'])
  })

  it('warms nothing for pages and unknown types', () => {
    expect(pathsForPayload({ _type: 'page', slug: 'about' })).toEqual([])
    expect(pathsForPayload({ _type: 'liveStatus' })).toEqual([])
    expect(pathsForPayload(undefined)).toEqual([])
  })
})

describe('POST /api/sanity/revalidate', () => {
  async function call(body: string, headers: Record<string, string>) {
    vi.resetModules()
    const revalidateTag = vi.fn()
    vi.doMock('next/cache', () => ({ revalidateTag }))
    const { POST } = await import('@/app/api/sanity/revalidate/route')
    const response = await POST(new Request('https://n8builds.dev/api/sanity/revalidate', { method: 'POST', body, headers }))
    return { response, revalidateTag }
  }

  it('marks the type tag stale for a signed delivery', async () => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET)
    const t = Date.now()
    const { response, revalidateTag } = await call(BODY, { 'sanity-webhook-signature': sign(BODY, t) })
    expect(response.status).toBe(200)
    // Outside Workers there is nothing to warm through.
    expect(await response.json()).toEqual({ revalidated: ['sanity:post'], warmed: [] })
    expect(revalidateTag).toHaveBeenCalledWith('sanity:post', 'max')
  })

  it('refuses an unsigned delivery and expires nothing', async () => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET)
    const { response, revalidateTag } = await call(BODY, {})
    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('fails closed when the secret is not configured', async () => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', '')
    const { response, revalidateTag } = await call(BODY, { 'sanity-webhook-signature': sign(BODY, Date.now()) })
    expect(response.status).toBe(500)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
