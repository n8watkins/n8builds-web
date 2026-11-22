import { describe, expect, it } from 'vitest'
import { IMMUTABLE, MEDIA, fetchWithRanges, noneMatch } from '../../worker/range.js'

const VIDEO = new Uint8Array(1000).map((_, i) => i % 256)
const ETAG = '"a40c273f9731aaaf23bb0cf373c29c75"'
const REVALIDATE = 'public, max-age=0, must-revalidate'
const FILES = new Set(['/builds/scribe/tour.mp4', '/_next/static/media/clip.0a1b2c3d.webm'])

/**
 * Workers static assets as the docs and the live site show them: the whole
 * file, an ETag, and Cache-Control only when the request has no Range header
 * (https://developers.cloudflare.com/workers/static-assets/headers/).
 */
const asked: Request[] = []
const assets = {
  fetch: async (request: Request) => {
    asked.push(request)
    if (!FILES.has(new URL(request.url).pathname)) return new Response('not found', { status: 404 })
    const headers = new Headers({ 'Content-Type': 'video/mp4', 'Content-Length': '1000', ETag: ETAG })
    if (!request.headers.has('Range')) headers.set('Cache-Control', REVALIDATE)
    return new Response(request.method === 'HEAD' ? null : VIDEO, { headers })
  },
}
const get = (headers: Record<string, string> = {}, path = '/builds/scribe/tour.mp4', method = 'GET') =>
  fetchWithRanges(new Request(`https://n8builds.dev${path}`, { method, headers }), assets)
const range = (value: string, path?: string) => get({ Range: value }, path)

describe('fetchWithRanges (worker/range.js)', () => {
  it('runs only for the videos', () => {
    expect(MEDIA.test('/builds/scribe/tour.mp4')).toBe(true)
    expect(MEDIA.test('/projects/pr-post-tour.webm')).toBe(true)
    expect(MEDIA.test('/_next/static/media/clip.0a1b2c3d.webm')).toBe(true)
    expect(MEDIA.test('/projects/riverwood.webp')).toBe(false)
  })

  it('answers a byte range with 206 and its Content-Range', async () => {
    const response = await range('bytes=0-99')
    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 0-99/1000')
    expect(response.headers.get('Content-Length')).toBe('100')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(VIDEO.slice(0, 100))
  })

  it('gives a 206 the same Cache-Control and ETag as the whole file', async () => {
    const whole = await get()
    const part = await range('bytes=0-99')
    expect(whole.headers.get('Cache-Control')).toBe(REVALIDATE)
    expect(part.headers.get('Cache-Control')).toBe(REVALIDATE)
    expect(part.headers.get('ETag')).toBe(ETAG)
  })

  it('asks the assets for the whole file, without the Range or the conditions', async () => {
    asked.length = 0
    await get({ Range: 'bytes=0-99', 'If-None-Match': '"other"', 'If-Range': ETAG })
    expect(asked).toHaveLength(1)
    for (const name of ['Range', 'If-None-Match', 'If-Range', 'If-Modified-Since']) expect(asked[0].headers.has(name), name).toBe(false)
  })

  it('handles open-ended and suffix ranges', async () => {
    expect((await range('bytes=990-')).headers.get('Content-Range')).toBe('bytes 990-999/1000')
    expect((await range('bytes=-10')).headers.get('Content-Range')).toBe('bytes 990-999/1000')
    expect((await range('bytes=900-5000')).headers.get('Content-Range')).toBe('bytes 900-999/1000')
  })

  it('refuses a range past the end with 416', async () => {
    const response = await range('bytes=5000-')
    expect(response.status).toBe(416)
    expect(response.headers.get('Content-Range')).toBe('bytes */1000')
  })

  it('sends the whole file, advertising ranges, without a Range header', async () => {
    const response = await get()
    expect(response.status).toBe(200)
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect((await response.arrayBuffer()).byteLength).toBe(1000)
  })

  it('answers a current copy with 304 before looking at the Range', async () => {
    const conditions: Record<string, string>[] = [{ 'If-None-Match': ETAG, Range: 'bytes=0-99' }, { 'If-None-Match': ETAG }, { 'If-None-Match': `"x", W/${ETAG}` }, { 'If-None-Match': '*' }]
    for (const headers of conditions) {
      const response = await get(headers)
      expect(response.status, JSON.stringify(headers)).toBe(304)
      expect(response.body).toBeNull()
      expect(response.headers.get('ETag')).toBe(ETAG)
      expect(response.headers.get('Cache-Control')).toBe(REVALIDATE)
      expect(response.headers.has('Content-Range')).toBe(false)
      expect(response.headers.has('Content-Length')).toBe(false)
    }
  })

  it('sends the range when the browser holds another version', async () => {
    const response = await get({ 'If-None-Match': '"older"', Range: 'bytes=0-99' })
    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 0-99/1000')
  })

  it('sends the whole file when If-Range no longer matches, the range when it does', async () => {
    const changed = await get({ 'If-Range': '"older"', Range: 'bytes=0-99' })
    expect(changed.status).toBe(200)
    expect((await changed.arrayBuffer()).byteLength).toBe(1000)
    expect((await get({ 'If-Range': ETAG, Range: 'bytes=0-99' })).status).toBe(206)
  })

  it('lets a content-hashed clip be kept for a year, in every answer', async () => {
    const path = '/_next/static/media/clip.0a1b2c3d.webm'
    expect((await get({}, path)).headers.get('Cache-Control')).toBe(IMMUTABLE)
    expect((await range('bytes=0-99', path)).headers.get('Cache-Control')).toBe(IMMUTABLE)
    expect((await get({ 'If-None-Match': ETAG, Range: 'bytes=0-99' }, path)).headers.get('Cache-Control')).toBe(IMMUTABLE)
    expect(IMMUTABLE).toBe('public, max-age=31536000, immutable')
  })

  it('answers HEAD with the headers only', async () => {
    const response = await get({ Range: 'bytes=0-99' }, undefined, 'HEAD')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(REVALIDATE)
  })

  it('passes a missing file through', async () => {
    expect((await range('bytes=0-1', '/builds/nope.mp4')).status).toBe(404)
  })
})

describe('noneMatch', () => {
  it('compares entity tags weakly, in a list, and takes *', () => {
    expect(noneMatch(ETAG, ETAG)).toBe(true)
    expect(noneMatch(`W/${ETAG}`, ETAG)).toBe(true)
    expect(noneMatch(`"a", ${ETAG}`, ETAG)).toBe(true)
    expect(noneMatch('*', null)).toBe(true)
    expect(noneMatch('"a"', ETAG)).toBe(false)
    expect(noneMatch(ETAG, null)).toBe(false)
  })
})
