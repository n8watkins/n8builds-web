import { after, NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey, recipientKey } from '@/lib/security/rateLimiter'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { sendLeaveEmail } from '@/lib/email/waitlist'
import { leaveRequestSchema, tokenSchema } from '@/lib/waitlist/schema'
import { findByEmail, leaveWaitlist } from '@/lib/waitlist/service'
import { waitlistStore } from '@/lib/waitlist/store'
import { LEAVE_LINK_MESSAGE, closed, fail, limited, readJson, unavailable } from '@/lib/waitlist/http'

/**
 * POST /api/waitlist/leave - three ways off the waitlist:
 * - `?t=<token>` from a mail client's one-click unsubscribe (List-Unsubscribe-Post).
 * And from /upcoming/leave:
 * - `{ token }` from an email's leave link: deletes the entry at once.
 * - `{ email, turnstile, honeypot }` for someone without a link: emails one,
 *   if the address is on the list. The answer is the same either way, so it
 *   can't be used to find out who is on it.
 */
export async function POST(request: NextRequest) {
  // A mail client's one-click unsubscribe (RFC 8058): a POST to the emails'
  // List-Unsubscribe URL, `?t=<leave token>`, with the form body
  // `List-Unsubscribe=One-Click`. It leaves the whole waitlist. No rate limit:
  // the token is the proof, and a mail provider sends these from few addresses.
  const oneClick = tokenSchema.safeParse({ token: request.nextUrl.searchParams.get('t') })
  if (oneClick.success) {
    const oneClickStore = await waitlistStore()
    if (!oneClickStore) return closed()
    try {
      await leaveWaitlist(oneClickStore, oneClick.data.token)
      return NextResponse.json({ message: 'Removed' })
    } catch (error) {
      logger.error('Waitlist one-click leave failed:', error instanceof Error ? error.message : error)
      return unavailable()
    }
  }

  const body = await readJson(request)
  if ('response' in body) return body.response

  const store = await waitlistStore()
  if (!store) return closed()
  const ip = getClientIp(request.headers)

  const withToken = tokenSchema.safeParse(body.data)
  if (withToken.success) {
    const ipLimit = await checkRateLimit('waitlist-ip', rateLimitIpKey(ip))
    if (!ipLimit.allowed) return limited(ipLimit)
    try {
      const removed = await leaveWaitlist(store, withToken.data.token)
      if (!removed) return fail(404, 'This address is no longer on the waitlist.', 'gone')
      return NextResponse.json({ message: 'Removed' })
    } catch (error) {
      logger.error('Waitlist leave failed:', error instanceof Error ? error.message : error)
      return unavailable()
    }
  }

  const byEmail = leaveRequestSchema.safeParse(body.data)
  if (!byEmail.success) return fail(400, 'Please enter the email address you signed up with.')
  if (!(await verifyTurnstile(byEmail.data.turnstile, ip))) {
    return fail(400, 'Verification failed. Please refresh the page and try again.')
  }
  const ipLimit = await checkRateLimit('waitlist-ip', rateLimitIpKey(ip))
  if (!ipLimit.allowed) return limited(ipLimit)
  const dailyLimit = await checkRateLimit('waitlist-global', 'all')
  if (!dailyLimit.allowed) return limited(dailyLimit)

  // After the answer, so its timing doesn't tell whether the address is on the list.
  const email = byEmail.data.email
  after(async () => {
    try {
      const entry = await findByEmail(store, email)
      if (entry && (await checkRateLimit('waitlist-recipient', recipientKey(entry.email))).allowed) {
        await sendLeaveEmail(entry, await store.issueLeaveLink(entry))
      }
    } catch (error) {
      logger.error('Waitlist leave link failed:', error instanceof Error ? error.message : error)
    }
  })
  return NextResponse.json({ message: LEAVE_LINK_MESSAGE })
}
