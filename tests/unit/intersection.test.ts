import { describe, expect, it } from 'vitest'
import { latestEntry } from '@/lib/intersection'

const entry = (isIntersecting: boolean) => ({ isIntersecting }) as IntersectionObserverEntry

describe('latestEntry', () => {
  it('reads the last entry: a scroll before the first delivery batches "out" then "in"', () => {
    expect(latestEntry([entry(false), entry(true)]).isIntersecting).toBe(true)
  })

  it('and "in" then "out" when the target left again', () => {
    expect(latestEntry([entry(true), entry(false)]).isIntersecting).toBe(false)
  })

  it('returns the only entry of an ordinary delivery', () => {
    const only = entry(true)
    expect(latestEntry([only])).toBe(only)
  })
})
