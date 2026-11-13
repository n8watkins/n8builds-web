import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey, recipientKey } from '@/lib/security/rateLimiter'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { sendConfirmEmail } from '@/lib/email/waitlist'
import { signUpWithKit } from '@/lib/newsletter/http'
import { newsletterOn } from '@/lib/newsletter/server'
import { waitlistTag } from '@/lib/newsletter/topics'
import { cleanReferrer, joinSchema, normalizeEmail, type JoinInput } from '@/lib/waitlist/schema'
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
 *
 * While the newsletter is on (lib/newsletter/server.ts) the sign-up goes to
 * Kit instead, tagged per project ("Waitlist: Feelium"), and nothing is
 * stored here: see joinWithKit below.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    if ('response' in body) return body.response

    const parsed = joinSchema.safeParse(body.data)
    if (!parsed.success) return fail(400, 'Please check the form: a valid email and at least one project.')
    const input = parsed.data

    if (await newsletterOn(request.cookies)) return joinWithKit(request, input)

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
        // Names what this request asked for, even a project the address already confirmed.
        const asked = { ...entry, requested: [...new Set([...entry.requested, ...input.projects])] }
        await sendConfirmEmail(asked, await store.issueLinks(entry))
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

/**
 * The waitlist on Kit (owner, 2026-11-12): the same checks and limits, then
 * the address goes to Kit with one tag per project, on the double opt-in
 * form, and Kit sends the confirm email. Kit keeps the address; this site
 * keeps nothing but the rate limits' counters. Past the per-address limit the
 * answer is the same, and Kit isn't called.
 */
async function joinWithKit(request: NextRequest, input: JoinInput) {
  const ip = getClientIp(request.headers)
  if (!(await verifyTurnstile(input.turnstile, ip))) {
    return fail(400, 'Verification failed. Please refresh the page and try again.')
  }
  const ipLimit = await checkRateLimit('waitlist-ip', rateLimitIpKey(ip))
  if (!ipLimit.allowed) return limited(ipLimit)
  const dailyLimit = await checkRateLimit('waitlist-global', 'all')
  if (!dailyLimit.allowed) return limited(dailyLimit)

  const address = normalizeEmail(input.email)
  const recipient = await checkRateLimit('waitlist-recipient', recipientKey(address))
  if (!recipient.allowed) {
    logger.warn('Waitlist: skipping Kit, this address had its sign-ups for today')
    return NextResponse.json({ message: JOINED_MESSAGE }, { status: 200 })
  }

  const referrer = cleanReferrer(input.source?.referrer) || 'https://n8builds.dev/upcoming'
  if (!(await signUpWithKit(address, input.projects.map(waitlistTag), referrer))) return unavailable()
  return NextResponse.json({ message: JOINED_MESSAGE }, { status: 200 })
}
