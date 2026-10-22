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
 * It is ignored whenever VERCEL is set (any environment), so a stray env var
 * can never weaken a deployed site. That includes a local .env.local pulled
 * with `vercel env pull`, which sets VERCEL=1; unset it for local test runs
 * (playwright.config.ts does).
 */
export function isContactTestMode(): boolean {
  if (process.env.CONTACT_TEST_MODE !== '1') return false

  if (process.env.VERCEL) {
    logger.error('CONTACT_TEST_MODE is set on Vercel - ignoring it')
    return false
  }

  return true
}
