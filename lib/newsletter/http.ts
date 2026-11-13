import { z } from 'zod'
import { logger } from '@/lib/logger'
import { KitError } from '@/lib/newsletter/kit'
import { kit, kitFormId } from '@/lib/newsletter/server'
import { TOPIC_IDS } from '@/lib/newsletter/topics'
import { fail } from '@/lib/waitlist/http'
import { email } from '@/lib/waitlist/schema'
import type { RateLimitResult } from '@/lib/security/rateLimiter'

/** The newsletter API's shared pieces (the request reading is the waitlist's, lib/waitlist/http.ts). */

export const DIRECT_EMAIL = 'contact@n8builds.dev'

/** The one answer to every accepted sign-up: new, pending and subscribed addresses alike. */
export const SUBSCRIBED_MESSAGE = 'Almost there: check your inbox and click the link to confirm.'

export const subscribeSchema = z.object({
  email,
  topics: z
    .array(z.enum(TOPIC_IDS))
    .min(1, 'Pick at least one topic')
    .max(TOPIC_IDS.length)
    .transform((list) => [...new Set(list)]),
  turnstile: z.string().min(1),
  // Hidden from people; a bot that fills every field fills this too.
  honeypot: z.string().max(0),
})

export const closed = () => fail(503, `The newsletter isn't open yet. Until then, follow along with RSS.`, 'closed')

export const unavailable = () =>
  fail(503, `The newsletter is having trouble right now. Please try again later, or email me at ${DIRECT_EMAIL}.`, 'unavailable')

export function limited(result: Exclude<RateLimitResult, { allowed: true }>) {
  if (result.reason === 'unavailable') return unavailable()
  return fail(429, 'Too many sign-ups from your connection. Please try again later.', 'rate_limit')
}

/**
 * Signs an address up in Kit with these tags; Kit sends the confirm email.
 * False when Kit isn't set up, has no form, or refused: the caller answers
 * 503, and nothing about the address is kept here.
 */
export async function signUpWithKit(address: string, tags: string[], referrer: string): Promise<boolean> {
  const client = kit()
  if (!client) return false
  try {
    const formId = await kitFormId(client)
    if (!formId) {
      logger.error('Kit: no form to sign up to (set KIT_FORM_ID, or keep exactly one active form)')
      return false
    }
    await client.subscribe(address, { formId, tags, referrer })
    return true
  } catch (error) {
    // KitError messages carry no address (lib/newsletter/kit.ts).
    logger.error('Kit sign-up failed:', error instanceof KitError ? error.message : 'error')
    return false
  }
}
