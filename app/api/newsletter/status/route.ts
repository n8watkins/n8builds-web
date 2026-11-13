import { NextRequest, NextResponse } from 'next/server'
import { newsletterOn } from '@/lib/newsletter/server'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * GET /api/newsletter/status -> { on }: whether the newsletter is live (the
 * owner's switch is on and Kit is set up). The forms ask once per page load
 * (hooks/useNewsletterOn.ts) instead of reading it at render time, because
 * pages are cached for days and the switch must take effect within a minute.
 * Browsers and the edge cache (worker/edge-cache.js) keep the answer 60
 * seconds, so a page view rarely reaches the database.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const on = await newsletterOn(request.cookies).catch(() => false)
  return NextResponse.json(
    { on },
    { headers: { 'Cache-Control': isContactTestMode() ? 'no-store' : 'public, max-age=60', 'X-Robots-Tag': 'noindex' } }
  )
}
