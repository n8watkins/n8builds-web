import { logger } from '@/lib/logger'

/**
 * Contact-form test mode for end-to-end tests against a production build
 * (`next build && next start`).
 *
 * When CONTACT_TEST_MODE=1:
 * - Emails go to Nodemailer's JSON transport instead of Gmail (nothing is sent)
 * - Rate limiting uses the in-memory store when Upstash isn't configured
 * - Turnstile accepts Cloudflare's test-key hostname
 *
 * It is ignored on Vercel (any environment), so a stray env var can never
 * weaken a deployed site.
 */
export function isContactTestMode(): boolean {
  if (process.env.CONTACT_TEST_MODE !== '1') return false

  if (process.env.VERCEL) {
    logger.error('CONTACT_TEST_MODE is set on Vercel - ignoring it')
    return false
  }

  return true
}
