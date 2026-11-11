import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey } from '@/lib/security/rateLimiter'
import { fail, readJson } from '@/lib/waitlist/http'
import { closed, limited, newsletterTokenSchema, unavailable } from '@/lib/newsletter/http'
import { newsletterStore } from '@/lib/newsletter/store'
import { z } from 'zod'

const bodySchema = z.object({ token: newsletterTokenSchema })

/**
 * POST /api/newsletter/confirm - the confirm link's button (/newsletter/confirm).
 * A POST, not the link itself: mail scanners open links, and must not confirm.
 */
export async function POST(request: NextRequest) {
  const body = await readJson(request)
  if ('response' in body) return body.response
  const parsed = bodySchema.safeParse(body.data)
  if (!parsed.success) return fail(400, 'This link looks incomplete. Please open it from the email again.')

  const store = await newsletterStore()
  if (!store) return closed()

  const ipLimit = await checkRateLimit('newsletter-ip', rateLimitIpKey(getClientIp(request.headers)))
  if (!ipLimit.allowed) return limited(ipLimit)

  try {
    const subscriber = await store.confirm(parsed.data.token)
    if (!subscriber) {
      return fail(404, 'This link has expired or was already used. You can sign up again on the blog.', 'expired')
    }
    return NextResponse.json({ message: 'Confirmed' })
  } catch (error) {
    logger.error('Newsletter confirm failed:', error instanceof Error ? error.message : error)
    return unavailable()
  }
}
