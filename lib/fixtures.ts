import { logger } from '@/lib/logger'

/**
 * Whether the GitHub reads (the build log, star counts, licenses, release
 * downloads) answer from the recorded test fixtures instead of GitHub:
 * BUILD_LOG_FIXTURE=1, which only the E2E suite's build sets
 * (playwright.config.ts). The fixtures fake values (Scribe's 1,234 stars), so
 * they must never reach a real visitor (owner, round 7 of 2026-11-09): like
 * CONTACT_TEST_MODE, the flag is ignored on any deployed site (APP_ENV is set
 * on every Worker; VERCEL_ENV on Vercel).
 */
export function usesFixtures(): boolean {
  if (process.env.BUILD_LOG_FIXTURE !== '1') return false
  if (process.env.APP_ENV || process.env.VERCEL_ENV) {
    logger.error('BUILD_LOG_FIXTURE is set on a deployed site - ignoring it')
    return false
  }
  return true
}
