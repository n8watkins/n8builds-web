import { z } from 'zod'
import { fail } from '@/lib/waitlist/http'
import { email } from '@/lib/waitlist/schema'
import type { RateLimitResult } from '@/lib/security/rateLimiter'

/** The newsletter API's shared pieces (the request reading is the waitlist's, lib/waitlist/http.ts). */

export const DIRECT_EMAIL = 'contact@n8builds.dev'

/** The one answer to every accepted sign-up: new, pending and subscribed addresses alike. */
export const SUBSCRIBED_MESSAGE = 'Almost there: check your inbox and click the link to confirm.'

export const subscribeSchema = z.object({
  email,
  turnstile: z.string().min(1),
  // Hidden from people; a bot that fills every field fills this too.
  honeypot: z.string().max(0),
})

export const newsletterTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{20,100}$/)

export const closed = () =>
  fail(503, `The newsletter isn't open yet. Until then, follow along with RSS.`, 'closed')

export const unavailable = () =>
  fail(503, `The newsletter is having trouble right now. Please try again later, or email me at ${DIRECT_EMAIL}.`, 'unavailable')

export function limited(result: Exclude<RateLimitResult, { allowed: true }>) {
  if (result.reason === 'unavailable') return unavailable()
  return fail(429, 'Too many sign-ups from your connection. Please try again later.', 'rate_limit')
}
