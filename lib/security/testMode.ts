import { logger } from '@/lib/logger'

/**
 * Contact-form test mode for end-to-end tests against a production build
 * (`next build && next start`).
 *
 * When CONTACT_TEST_MODE=1:
 * - Emails go to Nodemailer's JSON transport instead of Gmail (nothing is sent)
 * - Rate limiting always uses the in-memory store
 * - Turnstile accepts Cloudflare's test-key hostname
 *
 * It is ignored whenever APP_ENV is set (wrangler.jsonc sets it on every
 * deployed Worker), so a stray env var can never weaken a deployed site.
 * Unset it for local test runs (playwright.config.ts does).
 */
export function isContactTestMode(): boolean {
  if (process.env.CONTACT_TEST_MODE !== '1') return false

  if (process.env.APP_ENV) {
    logger.error('CONTACT_TEST_MODE is set on a deployed site - ignoring it')
    return false
  }

  return true
}
