import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { validateRequestSize } from '@/lib/security/validation'
import { fail } from '@/lib/waitlist/http'
import { newsletterTokenSchema, unavailable } from '@/lib/newsletter/http'
import { newsletterStore } from '@/lib/newsletter/store'

/**
 * POST /api/newsletter/unsubscribe - deletes the subscriber behind a token.
 *
 * Two callers:
 * - mail clients' one-click unsubscribe (RFC 8058): a POST to the
 *   List-Unsubscribe URL, `?t=<token>`, with the form body
 *   `List-Unsubscribe=One-Click`;
 * - the button on /newsletter/unsubscribe: JSON `{ token }`.
 * No login and no rate limit (the token is the proof, and a mail provider
 * sends many of these from a few addresses). Unsubscribing twice is fine:
 * the answer is the same once the row is gone.
 */
export async function POST(request: NextRequest) {
  const text = await request.text()
  const size = validateRequestSize(text)
  if (!size.success) return fail(size.statusCode ?? 413, size.error ?? 'Request too large')

  let token = request.nextUrl.searchParams.get('t')
  if (!token && request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    try {
      const body = JSON.parse(text) as { token?: unknown }
      token = typeof body.token === 'string' ? body.token : null
    } catch {
      token = null
    }
  }
  const parsed = newsletterTokenSchema.safeParse(token)
  if (!parsed.success) return fail(400, 'This link looks incomplete. Please open it from the email again.')

  const store = await newsletterStore()
  if (!store) return unavailable()

  try {
    await store.unsubscribe(parsed.data)
    return NextResponse.json({ message: "You're unsubscribed: your address is deleted." })
  } catch (error) {
    logger.error('Newsletter unsubscribe failed:', error instanceof Error ? error.message : error)
    return unavailable()
  }
}
