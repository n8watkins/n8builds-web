import { NextRequest, NextResponse } from 'next/server'
import { testKit } from '@/lib/newsletter/kitFake'
import { isContactTestMode } from '@/lib/security/testMode'

export const dynamic = 'force-dynamic'

/**
 * GET /api/test/kit?email=<address> - what the test-mode Kit stand-in holds
 * for that address (lib/newsletter/kitFake.ts): its state, tags and forms,
 * or null. Only in CONTACT_TEST_MODE, which a deployed Worker always ignores:
 * everywhere else it is a 404.
 */
export function GET(request: NextRequest) {
  if (!isContactTestMode()) return new NextResponse(null, { status: 404 })
  const email = request.nextUrl.searchParams.get('email') ?? ''
  return NextResponse.json({ subscriber: testKit().subscriber(email) }, { headers: { 'Cache-Control': 'no-store' } })
}
