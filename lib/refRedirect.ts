import 'server-only'
import { after, NextResponse, type NextRequest } from 'next/server'
import { countReferral } from '@/lib/analyticsStore'
import { analyticsDb } from '@/lib/db'
import { refDestination, refSource, type RefTarget } from '@/lib/referrals'
import { checkRateLimit, getClientIp, rateLimitIpKey } from '@/lib/security/rateLimiter'

// Link previews and crawlers follow links too; they aren't referrals.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|discord|telegram/i

/**
 * A counted short link (lib/referrals.ts): redirects at once, then adds the
 * click to the day's count after the response is sent, so a slow or missing
 * database never holds the visitor up. An IP's clicks past 20 an hour still
 * redirect but aren't counted, so a script can't stuff the counts.
 */
export function refRedirect(request: NextRequest, target: RefTarget): NextResponse {
  const params = request.nextUrl.searchParams
  const from = refSource(params.get('from'))
  if (!BOT.test(request.headers.get('user-agent') ?? '')) {
    const ip = rateLimitIpKey(getClientIp(request.headers))
    after(async () => {
      const db = await analyticsDb()
      if (!db) return
      if (!(await checkRateLimit('ref-ip', ip)).allowed) return
      await countReferral(db, target, from)
    })
  }
  const response = NextResponse.redirect(refDestination(target, from, params.get('to')), 302)
  // Every click must reach this function to be counted: never cached.
  response.headers.set('Cache-Control', 'no-store')
  return response
}
