import { NextRequest, NextResponse } from 'next/server'
import { parseJsonBody, validateRequestSize } from '@/lib/security/validation'
import type { RateLimitResult } from '@/lib/security/rateLimiter'

/** The waitlist API's shared pieces: reading a request and its error answers. */

export const DIRECT_EMAIL = 'contact@n8builds.dev'

export const JOINED_MESSAGE = 'Almost there: check your inbox and click the link to confirm your spot.'
export const LEAVE_LINK_MESSAGE = 'If that address is on the waitlist, a link to manage it is on its way.'

export const fail = (status: number, error: string, type?: string) =>
  NextResponse.json(type ? { error, type } : { error }, { status })

/** The JSON body of a request, or the response to send instead. */
export async function readJson(request: NextRequest): Promise<{ data: unknown } | { response: NextResponse }> {
  const text = await request.text()
  const size = validateRequestSize(text)
  if (!size.success) return { response: fail(size.statusCode ?? 413, size.error ?? 'Request too large') }
  // A JSON content type also rules out cross-site "simple" form posts.
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return { response: fail(415, 'Expected a JSON request.') }
  }
  const parsed = parseJsonBody(text)
  if (!parsed.success) return { response: fail(parsed.statusCode ?? 400, parsed.error ?? 'Invalid JSON') }
  return { data: parsed.data }
}

export const closed = () =>
  fail(
    503,
    `The waitlist opens soon. Until then, email me at ${DIRECT_EMAIL} and I'll let you know when there is something to try.`,
    'closed'
  )

export const unavailable = () =>
  fail(503, `The waitlist is having trouble right now. Please try again later, or email me at ${DIRECT_EMAIL}.`, 'unavailable')

export function limited(result: Exclude<RateLimitResult, { allowed: true }>) {
  if (result.reason === 'unavailable') return unavailable()
  return fail(
    429,
    `Too many requests from your connection. Please try again later, or email me at ${DIRECT_EMAIL}.`,
    'rate_limit'
  )
}
