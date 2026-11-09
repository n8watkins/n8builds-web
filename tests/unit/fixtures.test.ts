import { describe, expect, it, vi } from 'vitest'
import { usesFixtures } from '@/lib/fixtures'

/** The recorded fixtures (fake star counts) never reach a deployed site (round 7 of 2026-11-09). */
describe('usesFixtures', () => {
  it('is on only for BUILD_LOG_FIXTURE=1', () => {
    vi.stubEnv('APP_ENV', '')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('BUILD_LOG_FIXTURE', '')
    expect(usesFixtures()).toBe(false)
    vi.stubEnv('BUILD_LOG_FIXTURE', '1')
    expect(usesFixtures()).toBe(true)
  })

  it('is ignored on a deployed Worker or on Vercel', () => {
    vi.stubEnv('BUILD_LOG_FIXTURE', '1')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('APP_ENV', 'production')
    expect(usesFixtures()).toBe(false)
    vi.stubEnv('APP_ENV', '')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(usesFixtures()).toBe(false)
  })
})
