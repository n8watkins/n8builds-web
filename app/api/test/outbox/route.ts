import { NextRequest, NextResponse } from 'next/server'
import { testEmailsTo } from '@/lib/email/outbox'
import { isContactTestMode } from '@/lib/security/testMode'

export const dynamic = 'force-dynamic'

/**
 * GET /api/test/outbox?to=<address> - the emails a test run would have sent
 * to that address (lib/email/outbox.ts). Only in CONTACT_TEST_MODE, which a
 * deployed Worker always ignores: everywhere else it is a 404.
 */
export function GET(request: NextRequest) {
  if (!isContactTestMode()) return new NextResponse(null, { status: 404 })
  const to = request.nextUrl.searchParams.get('to') ?? ''
  return NextResponse.json({ emails: testEmailsTo(to) }, { headers: { 'Cache-Control': 'no-store' } })
}
