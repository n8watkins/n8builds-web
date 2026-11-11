import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey, recipientKey } from '@/lib/security/rateLimiter'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { fail, readJson } from '@/lib/waitlist/http'
import { normalizeEmail } from '@/lib/waitlist/schema'
import { CONFIRM_SUBJECT, createConfirmHtml, createConfirmText, unsubscribeHeaders } from '@/lib/newsletter/emails'
import { DIRECT_EMAIL, SUBSCRIBED_MESSAGE, closed, limited, subscribeSchema, unavailable } from '@/lib/newsletter/http'
import { requestMailer } from '@/lib/newsletter/mail'
import { newsletterStore } from '@/lib/newsletter/store'

/**
 * POST /api/newsletter - sign up for the blog newsletter (N8's Notions by email).
 *
 * In order, every free check before the first database call (as the waitlist):
 * 1. Size, JSON content type, schema (the honeypot must be empty)
 * 2. The database is there (else 503)
 * 3. Cloudflare Turnstile
 * 4. Per-IP limit, then the site-wide daily limit on confirm emails
 * 5. Save the address, unconfirmed (lib/newsletter/store.ts)
 * 6. The confirm email, unless the address is already subscribed or had its
 *    confirm emails for today
 * The answer is the same for a new, pending or subscribed address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    if ('response' in body) return body.response

    const parsed = subscribeSchema.safeParse(body.data)
    if (!parsed.success) return fail(400, 'Please enter a valid email address.')
    const input = parsed.data

    const store = await newsletterStore()
    if (!store) return closed()

    const ip = getClientIp(request.headers)
    if (!(await verifyTurnstile(input.turnstile, ip))) {
      return fail(400, 'Verification failed. Please refresh the page and try again.')
    }

    const ipLimit = await checkRateLimit('newsletter-ip', rateLimitIpKey(ip))
    if (!ipLimit.allowed) return limited(ipLimit)
    const dailyLimit = await checkRateLimit('newsletter-global', 'all')
    if (!dailyLimit.allowed) return limited(dailyLimit)

    let result
    try {
      result = await store.subscribe(normalizeEmail(input.email))
    } catch (error) {
      logger.error('Newsletter store failed:', error instanceof Error ? error.message : error)
      return unavailable()
    }

    if (result.status === 'pending') {
      const { subscriber, confirmToken } = result
      const recipient = await checkRateLimit('newsletter-recipient', recipientKey(subscriber.email))
      if (recipient.allowed) {
        const sent = await requestMailer()({
          kind: 'confirm',
          to: subscriber.email,
          subject: CONFIRM_SUBJECT,
          html: createConfirmHtml(confirmToken, subscriber.unsubscribeToken),
          text: createConfirmText(confirmToken, subscriber.unsubscribeToken),
          headers: unsubscribeHeaders(subscriber.unsubscribeToken),
          key: `confirm-${subscriber.id}-${confirmToken.slice(0, 16)}`,
        }).catch((error: unknown) => ({ ok: false as const, code: error instanceof Error ? error.message : 'error' }))
        // A refusal is a failure, never retried.
        if (!sent.ok) {
          logger.error('Newsletter confirm email failed:', sent.code)
          return fail(500, `The confirmation email didn't go out. Please try again later, or email me at ${DIRECT_EMAIL}.`)
        }
      } else {
        logger.warn('Newsletter: skipping the confirm email, this address had its emails for today')
      }
    }

    return NextResponse.json({ message: SUBSCRIBED_MESSAGE }, { status: 200 })
  } catch (error) {
    logger.error('Newsletter sign-up error:', error)
    return fail(500, `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`)
  }
}
