import { describe, expect, it } from 'vitest'
import { fullPages } from '@/lib/full-pages'

describe('fullPages', () => {
  it('fills the last page with the first items again', () => {
    expect(fullPages(7, 4)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 0],
    ])
    expect(fullPages(9, 4)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 0, 1, 2],
    ])
  })

  it('keeps pages as they are when the items divide evenly', () => {
    expect(fullPages(8, 4)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ])
  })

  it('shows a page or less of items once, without repeating any', () => {
    expect(fullPages(4, 4)).toEqual([[0, 1, 2, 3]])
    expect(fullPages(3, 4)).toEqual([[0, 1, 2]])
    expect(fullPages(1, 4)).toEqual([[0]])
    expect(fullPages(0, 4)).toEqual([])
  })

  it('never shows fewer than a full page once there is more than one', () => {
    for (let count = 5; count <= 30; count++) for (const page of fullPages(count, 4)) expect(page).toHaveLength(4)
  })
})
