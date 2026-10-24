import { describe, expect, it } from 'vitest'
import { xShareUrl } from '@/components/blog/ShareBar'

describe('xShareUrl', () => {
  it('opens X compose with the title, the link and a credit, all encoded', () => {
    const url = new URL(xShareUrl('Speed & Mastery?', 'https://n8builds.dev/blog/speed-beats-mastery'))
    expect(url.origin + url.pathname).toBe('https://x.com/intent/post')
    expect(url.searchParams.get('text')).toBe('Speed & Mastery?')
    expect(url.searchParams.get('url')).toBe('https://n8builds.dev/blog/speed-beats-mastery')
    expect(url.searchParams.get('via')).toBe('n8watkins')
  })
})
