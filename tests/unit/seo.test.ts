import { describe, expect, it } from 'vitest'
import { DEFAULT_PREVIEW, pageMetadata, shareSummary, summarize } from '@/lib/seo'

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

describe('shareSummary', () => {
  it('leaves text that fits alone', () => {
    expect(shareSummary('Short and sweet.')).toBe('Short and sweet.')
  })

  it('keeps whole sentences while they fit, never ending mid-thought', () => {
    const text = 'First sentence here. Second one is a bit longer! Third would not fit at all within the limit.'
    expect(shareSummary(text, 50)).toBe('First sentence here. Second one is a bit longer!')
  })

  it('does not split a sentence at a dot inside a word', () => {
    expect(shareSummary('The log for n8builds.dev, all of it. More text that pushes it over.', 40)).toBe(
      'The log for n8builds.dev, all of it.'
    )
  })

  it('falls back to a word-boundary cut when the first sentence is too long', () => {
    const out = shareSummary('word '.repeat(40) + 'end.', 40)
    expect(out.length).toBeLessThanOrEqual(40)
    expect(out.endsWith('…')).toBe(true)
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
