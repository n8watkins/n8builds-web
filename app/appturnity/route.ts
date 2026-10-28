import type { NextRequest } from 'next/server'
import { refRedirect } from '@/lib/refRedirect'

/** n8builds.dev/appturnity: a counted short link (lib/referrals.ts). */
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return refRedirect(request, 'appturnity')
}
