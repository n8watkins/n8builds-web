import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey, recipientKey } from '@/lib/security/rateLimiter'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { fail, readJson } from '@/lib/waitlist/http'
import { normalizeEmail } from '@/lib/waitlist/schema'
import { DIRECT_EMAIL, SUBSCRIBED_MESSAGE, closed, limited, signUpWithKit, subscribeSchema, unavailable } from '@/lib/newsletter/http'
import { newsletterOn } from '@/lib/newsletter/server'
import { topicTags } from '@/lib/newsletter/topics'

/**
 * POST /api/newsletter - sign up for the n8builds newsletter, which Kit keeps
 * and sends (lib/newsletter/kit.ts). Nothing about the address is stored
 * here: only the rate limits' counters, keyed by a hash.
 *
 * In order, every free check before the first outside call:
 * 1. Size, JSON content type, schema (the honeypot must be empty, at least one topic)
 * 2. The owner's switch is on and Kit is set up (else 503 "closed")
 * 3. Cloudflare Turnstile
 * 4. Per-IP limit, then the site-wide daily limit
 * 5. Per-address daily limit: past it, the same answer and no call to Kit
 * 6. Kit: the address, tagged with its topics, on the double opt-in form (Kit sends the confirm email)
 * The answer is the same for a new, pending or subscribed address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    if ('response' in body) return body.response

    const parsed = subscribeSchema.safeParse(body.data)
    if (!parsed.success) return fail(400, 'Please enter a valid email address and pick at least one topic.')
    const input = parsed.data

    if (!(await newsletterOn(request.cookies))) return closed()

    const ip = getClientIp(request.headers)
    if (!(await verifyTurnstile(input.turnstile, ip))) {
      return fail(400, 'Verification failed. Please refresh the page and try again.')
    }

    const ipLimit = await checkRateLimit('newsletter-ip', rateLimitIpKey(ip))
    if (!ipLimit.allowed) return limited(ipLimit)
    const dailyLimit = await checkRateLimit('newsletter-global', 'all')
    if (!dailyLimit.allowed) return limited(dailyLimit)

    const address = normalizeEmail(input.email)
    const recipient = await checkRateLimit('newsletter-recipient', recipientKey(address))
    if (!recipient.allowed) {
      logger.warn('Newsletter: skipping Kit, this address had its sign-ups for today')
      return NextResponse.json({ message: SUBSCRIBED_MESSAGE }, { status: 200 })
    }

    if (!(await signUpWithKit(address, topicTags(input.topics), 'https://n8builds.dev/blog'))) return unavailable()

    return NextResponse.json({ message: SUBSCRIBED_MESSAGE }, { status: 200 })
  } catch (error) {
    logger.error('Newsletter sign-up error:', error instanceof Error ? error.message : 'error')
    return fail(500, `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`)
  }
}
