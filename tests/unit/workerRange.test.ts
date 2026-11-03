import { describe, expect, it } from 'vitest'
import { MEDIA, fetchWithRanges } from '../../worker/range.js'

const VIDEO = new Uint8Array(1000).map((_, i) => i % 256)
const assets = {
  fetch: async (request: Request) =>
    new URL(request.url).pathname === '/builds/scribe/tour.mp4'
      ? new Response(VIDEO, { headers: { 'Content-Type': 'video/mp4', 'Content-Length': '1000' } })
      : new Response('not found', { status: 404 }),
}
const get = (range?: string, path = '/builds/scribe/tour.mp4', method = 'GET') =>
  fetchWithRanges(new Request(`https://n8builds.dev${path}`, { method, headers: range ? { Range: range } : {} }), assets)

describe('fetchWithRanges (worker/range.js)', () => {
  it('runs only for the videos', () => {
    expect(MEDIA.test('/builds/scribe/tour.mp4')).toBe(true)
    expect(MEDIA.test('/projects/pr-post-tour.webm')).toBe(true)
    expect(MEDIA.test('/projects/riverwood.webp')).toBe(false)
  })

  it('answers a byte range with 206 and its Content-Range', async () => {
    const response = await get('bytes=0-99')
    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 0-99/1000')
    expect(response.headers.get('Content-Length')).toBe('100')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(VIDEO.slice(0, 100))
  })

  it('handles open-ended and suffix ranges', async () => {
    expect((await get('bytes=990-')).headers.get('Content-Range')).toBe('bytes 990-999/1000')
    expect((await get('bytes=-10')).headers.get('Content-Range')).toBe('bytes 990-999/1000')
    expect((await get('bytes=900-5000')).headers.get('Content-Range')).toBe('bytes 900-999/1000')
  })

  it('refuses a range past the end with 416', async () => {
    const response = await get('bytes=5000-')
    expect(response.status).toBe(416)
    expect(response.headers.get('Content-Range')).toBe('bytes */1000')
  })

  it('sends the whole file, advertising ranges, without a Range header', async () => {
    const response = await get()
    expect(response.status).toBe(200)
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect((await response.arrayBuffer()).byteLength).toBe(1000)
  })

  it('passes a missing file through', async () => {
    expect((await get('bytes=0-1', '/builds/nope.mp4')).status).toBe(404)
  })
})
