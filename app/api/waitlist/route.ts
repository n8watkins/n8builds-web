import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey, recipientKey } from '@/lib/security/rateLimiter'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { sendConfirmEmail } from '@/lib/email/waitlist'
import { joinSchema } from '@/lib/waitlist/schema'
import { joinWaitlist } from '@/lib/waitlist/service'
import { waitlistStore } from '@/lib/waitlist/store'
import { DIRECT_EMAIL, JOINED_MESSAGE, closed, fail, limited, readJson, unavailable } from '@/lib/waitlist/http'

/**
 * POST /api/waitlist - join the waitlist for one or more upcoming projects.
 *
 * In order, every free check before the first database call (as the contact form):
 * 1. Size, JSON content type, schema (the honeypot must be empty)
 * 2. The waitlist is configured (else 503 "opens soon")
 * 3. Cloudflare Turnstile
 * 4. Per-IP limit, then the site-wide daily email limit
 * 5. Save the request (it waits for confirmation, lib/waitlist/service.ts)
 * 6. New single-use links and the confirm email, unless this address already
 *    had 3 waitlist emails today (an earlier unused link confirms this request too)
 * The answer is the same for a new, pending or confirmed address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    if ('response' in body) return body.response

    const parsed = joinSchema.safeParse(body.data)
    if (!parsed.success) return fail(400, 'Please check the form: a valid email and at least one project.')
    const input = parsed.data

    const store = await waitlistStore()
    if (!store) return closed()

    const ip = getClientIp(request.headers)
    if (!(await verifyTurnstile(input.turnstile, ip))) {
      return fail(400, 'Verification failed. Please refresh the page and try again.')
    }

    const ipLimit = await checkRateLimit('waitlist-ip', rateLimitIpKey(ip))
    if (!ipLimit.allowed) return limited(ipLimit)
    const dailyLimit = await checkRateLimit('waitlist-global', 'all')
    if (!dailyLimit.allowed) return limited(dailyLimit)

    let entry
    try {
      entry = await joinWaitlist(store, {
        email: input.email,
        projects: input.projects,
        note: input.note,
        interest: input.source?.interest,
        referrer: input.source?.referrer,
      })
    } catch (error) {
      logger.error('Waitlist store failed:', error instanceof Error ? error.message : error)
      return unavailable()
    }

    const recipient = await checkRateLimit('waitlist-recipient', recipientKey(entry.email))
    if (recipient.allowed) {
      try {
        await sendConfirmEmail(entry, await store.issueLinks(entry))
      } catch (error) {
        logger.error('Waitlist confirm email failed:', error instanceof Error ? error.message : error)
        return fail(500, `The confirmation email didn't go out. Please try again in a minute, or email me at ${DIRECT_EMAIL}.`)
      }
    } else {
      logger.warn('Waitlist: skipping the confirm email, this address had its emails for today')
    }

    return NextResponse.json({ message: JOINED_MESSAGE }, { status: 200 })
  } catch (error) {
    logger.error('Waitlist join error:', error)
    return fail(500, `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`)
  }
}
