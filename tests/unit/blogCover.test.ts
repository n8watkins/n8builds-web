import { describe, expect, it } from 'vitest'
import { COVER_VERSION, coverAccent, coverSvg, coverUrl } from '@/lib/blog-cover'
import { GET } from '@/app/notions-cover/[version]/[topic]/[file]/route'

function get(version: string, topic: string, file: string) {
  const ctx = { params: Promise.resolve({ version, topic, file }) }
  return GET(new Request('http://localhost/'), ctx as Parameters<typeof GET>[1])
}

describe('coverSvg', () => {
  it('is deterministic per post and different between posts', () => {
    expect(coverSvg('growth', 'a-post')).toBe(coverSvg('growth', 'a-post'))
    expect(coverSvg('growth', 'a-post')).not.toBe(coverSvg('growth', 'another-post'))
  })

  it('never writes the topic or slug into the SVG', () => {
    const svg = coverSvg('growth', 'unique-slug-marker')
    expect(svg).not.toContain('unique-slug-marker')
    expect(svg).not.toContain('growth')
  })

  it('is a standalone SVG with no script or external reference', () => {
    const svg = coverSvg('startup', 'post')
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg).not.toMatch(/<script|href=|https?:\/\/(?!www\.w3\.org)/)
  })
})

describe('coverAccent', () => {
  it('gives every post on a topic the same colour', () => {
    expect(coverAccent('building-in-public', 'one')).toBe(coverAccent('building-in-public', 'two'))
  })

  it('stays inside the site palette (no purple) for unknown topics too', () => {
    const palette = ['#22d3ee', '#60a5fa', '#34d399', '#fbbf24', '#38bdf8', '#2dd4bf']
    for (const topic of ['rust', 'design', 'ops', undefined]) {
      expect(palette).toContain(coverAccent(topic, 'some-post'))
    }
  })
})

describe('coverUrl', () => {
  it('builds the versioned file path, with a placeholder topic', () => {
    expect(coverUrl('growth', 'my-post')).toBe(`/notions-cover/${COVER_VERSION}/growth/my-post.svg`)
    expect(coverUrl(undefined, 'my-post')).toBe(`/notions-cover/${COVER_VERSION}/notes/my-post.svg`)
  })
})

describe('GET /notions-cover/[version]/[topic]/[file]', () => {
  it('serves the cover as a long-cached SVG', async () => {
    const response = await get(COVER_VERSION, 'growth', 'my-post.svg')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/svg+xml')
    expect(response.headers.get('cache-control')).toContain('immutable')
    expect(await response.text()).toBe(coverSvg('growth', 'my-post'))
  })

  it.each([
    ['an old version', ['v0', 'growth', 'my-post.svg']],
    ['another extension', [COVER_VERSION, 'growth', 'my-post.png']],
    ['an invalid topic', [COVER_VERSION, 'Gro<w>th', 'my-post.svg']],
    ['an invalid slug', [COVER_VERSION, 'growth', '../secrets.svg']],
    ['an oversized slug', [COVER_VERSION, 'growth', `${'a'.repeat(121)}.svg`]],
  ])('returns 404 for %s', async (_case, [version, topic, file]) => {
    expect((await get(version, topic, file)).status).toBe(404)
  })
})
