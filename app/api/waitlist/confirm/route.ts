import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey } from '@/lib/security/rateLimiter'
import { projectList } from '@/lib/email/waitlist'
import { tokenSchema } from '@/lib/waitlist/schema'
import { confirmWaitlist } from '@/lib/waitlist/service'
import { waitlistStore } from '@/lib/waitlist/store'
import { closed, fail, limited, readJson, unavailable } from '@/lib/waitlist/http'

/**
 * POST /api/waitlist/confirm - the confirm link's button (/upcoming/confirm).
 * A POST, not the link itself: mail scanners open links, and must not confirm.
 */
export async function POST(request: NextRequest) {
  const body = await readJson(request)
  if ('response' in body) return body.response
  const parsed = tokenSchema.safeParse(body.data)
  if (!parsed.success) return fail(400, 'This link looks incomplete. Please open it from the email again.')

  const store = waitlistStore()
  if (!store) return closed()

  const ipLimit = await checkRateLimit('waitlist-ip', rateLimitIpKey(getClientIp(request.headers)))
  if (!ipLimit.allowed) return limited(ipLimit)

  try {
    const entry = await confirmWaitlist(store, parsed.data.token)
    if (!entry) {
      return fail(
        404,
        'This link has expired or the address has left the waitlist. You can join again on the upcoming page.',
        'expired'
      )
    }
    return NextResponse.json({ message: 'Confirmed', projects: projectList(entry.projects) })
  } catch (error) {
    logger.error('Waitlist confirm failed:', error instanceof Error ? error.message : error)
    return unavailable()
  }
}
