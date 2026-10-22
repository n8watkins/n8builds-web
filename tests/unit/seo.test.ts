import { describe, expect, it } from 'vitest'
import { DEFAULT_PREVIEW, pageMetadata, summarize } from '@/lib/seo'

describe('summarize', () => {
  it('leaves short text alone, apart from whitespace', () => {
    expect(summarize('  A short\n description. ')).toBe('A short description.')
  })

  it('cuts long text at a word boundary with an ellipsis', () => {
    const text = 'word '.repeat(60)
    const out = summarize(text, 40)
    expect(out.length).toBeLessThanOrEqual(40)
    expect(out).toMatch(/^(word )*word…$/)
  })

  it('drops trailing punctuation before the ellipsis', () => {
    expect(summarize('One, two, three, four, five', 18)).toBe('One, two, three…')
  })
})

describe('pageMetadata', () => {
  it('always sets the canonical URL, og:url and a preview image', () => {
    const meta = pageMetadata({ title: 'T', description: 'D', path: '/x' })
    expect(meta.alternates?.canonical).toBe('/x')
    expect(meta.openGraph).toMatchObject({ url: '/x', siteName: 'n8builds', type: 'website', images: [DEFAULT_PREVIEW] })
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', images: [DEFAULT_PREVIEW] })
  })

  it('marks articles and keeps their dates', () => {
    const meta = pageMetadata({ title: 'T', description: 'D', path: '/b', article: { publishedTime: '2026-10-01' } })
    expect(meta.openGraph).toMatchObject({ type: 'article', publishedTime: '2026-10-01' })
  })
})
