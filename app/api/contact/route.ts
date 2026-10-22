import { NextRequest, NextResponse } from 'next/server'
import { contactFormSchema } from '@/lib/validations/contact'
import { logger } from '@/lib/logger'
import {
  checkRateLimit,
  getClientIp,
  rateLimitIpKey,
  recipientKey,
  type RateLimitResult,
} from '@/lib/security/rateLimiter'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { validateRequestSize, parseJsonBody } from '@/lib/security/validation'
import { sendContactEmails } from '@/lib/email/sender'

const DIRECT_EMAIL = 'nathancwatkins23@gmail.com'

/**
 * POST /api/contact - Handle contact form submissions
 *
 * SECURITY LAYERS (in order). Every check that costs nothing runs before the
 * first Upstash call, so junk requests can't spend the Redis quota (and, once
 * it's gone, shut the form for everyone):
 * 1. Request size validation (10KB limit) and a JSON content type, which
 *    also rules out cross-site "simple" form posts
 * 2. Input validation (Zod schema, which also requires the hidden honeypot
 *    field to be empty)
 * 3. Cloudflare Turnstile verification
 * 4. Per-IP rate limit (5/hour; IPv6 counted per /64)
 * 5. Site-wide daily limit
 * 6. Per-recipient auto-reply limit (1/day per address), so the form can't be
 *    used to mail one third party repeatedly. Over it, the owner notification
 *    still goes out; only the auto-reply is skipped.
 *
 * Then sends the notification email (to site owner) and auto-reply (to submitter).
 */
export async function POST(request: NextRequest) {
  logger.info('🚀 Contact API called')

  try {
    // STEP 1: Request size and type
    const bodyText = await request.text()
    const sizeValidation = validateRequestSize(bodyText)

    if (!sizeValidation.success) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: sizeValidation.statusCode }
      )
    }

    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Expected a JSON request.' }, { status: 415 })
    }

    // STEP 2: Input validation
    const parseResult = parseJsonBody(bodyText)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error },
        { status: parseResult.statusCode }
      )
    }

    const validation = contactFormSchema.safeParse(parseResult.data)
    if (!validation.success) {
      // Security: don't expose detailed validation errors
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs and try again.' },
        { status: 400 }
      )
    }
    const validatedData = validation.data
    logger.info('✅ Validation passed')

    // STEP 3: Cloudflare Turnstile
    const clientIp = getClientIp(request.headers)
    const isTurnstileValid = await verifyTurnstile(validatedData.turnstile, clientIp)
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'Verification failed. Please refresh the page and try again.' },
        { status: 400 }
      )
    }

    // STEP 4: Per-IP rate limit
    const ipLimit = await checkRateLimit('ip', rateLimitIpKey(clientIp))
    if (!ipLimit.allowed) {
      logger.info('❌ Per-IP rate limit:', ipLimit.reason)
      return rateLimitResponse(ipLimit)
    }

    // STEP 5: Site-wide daily limit
    const globalLimit = await checkRateLimit('global', 'all')
    if (!globalLimit.allowed) {
      logger.warn('❌ Site-wide contact limit:', globalLimit.reason)
      return rateLimitResponse(globalLimit)
    }

    // STEP 6: Per-recipient auto-reply limit
    const recipientLimit = await checkRateLimit('recipient', recipientKey(validatedData.email))
    const autoReply = recipientLimit.allowed
    if (!autoReply) logger.warn('⚠️ Skipping auto-reply:', recipientLimit.reason)

    // STEP 7: Send emails
    const emailResult = await sendContactEmails(validatedData, { autoReply })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error },
        { status: 500 }
      )
    }

    logger.info('🎉 Contact form submission successful!')
    return NextResponse.json(
      { message: 'Message sent successfully!' },
      { status: 200 }
    )

  } catch (error) {
    logger.error('❌ Contact form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}

function rateLimitResponse(result: Exclude<RateLimitResult, { allowed: true }>) {
  if (result.reason === 'unavailable') {
    return NextResponse.json(
      {
        error: `The contact form is temporarily unavailable. Please email me directly at ${DIRECT_EMAIL}.`,
        type: 'unavailable',
      },
      { status: 503 }
    )
  }

  return NextResponse.json(
    {
      error: `Your message didn't go through due to our submission limit. Please try again later, or reach out directly at ${DIRECT_EMAIL} - I'd love to hear from you!`,
      type: 'rate_limit',
    },
    { status: 429 }
  )
}
