import { describe, expect, it } from 'vitest'
import { dayListNote } from '@/lib/day-list'

/**
 * The homepage list for a day picked on the build log card (owner,
 * 2026-11-25): never an empty box. A day with changes but no entry (all of
 * its work in an unlisted project) says so; a quiet day says nothing shipped.
 */
describe('the day list note', () => {
  it('stays out of the way when the day has entries', () => {
    expect(dayListNote(32, 2)).toBeNull()
  })
  it('says a day with changes and no entry has no write-up', () => {
    expect(dayListNote(32, 0)).toBe('32 changes that day; none have a write-up here.')
    expect(dayListNote(1, 0)).toBe('1 change that day; none have a write-up here.')
  })
  it('says a quiet day shipped nothing', () => {
    expect(dayListNote(0, 0)).toBe('Nothing shipped that day.')
  })
})
