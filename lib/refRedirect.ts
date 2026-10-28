import 'server-only'
import { after, NextResponse, type NextRequest } from 'next/server'
import { analyticsStore, countReferral } from '@/lib/analyticsStore'
import { refDestination, refSource, type RefTarget } from '@/lib/referrals'

// Link previews and crawlers follow links too; they aren't referrals.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|discord|telegram/i

/**
 * A counted short link (lib/referrals.ts): redirects at once, then adds the
 * click to the day's count after the response is sent, so a slow or missing
 * database never holds the visitor up.
 */
export function refRedirect(request: NextRequest, target: RefTarget): NextResponse {
  const params = request.nextUrl.searchParams
  const from = refSource(params.get('from'))
  const store = analyticsStore()
  if (store && !BOT.test(request.headers.get('user-agent') ?? '')) {
    after(() => countReferral(store, target, from))
  }
  const response = NextResponse.redirect(refDestination(target, from, params.get('to')), 302)
  // Every click must reach this function to be counted: never cached.
  response.headers.set('Cache-Control', 'no-store')
  return response
}
