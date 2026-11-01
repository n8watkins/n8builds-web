import type { NextRequest } from 'next/server'
import { refRedirect } from '@/lib/refRedirect'

/** n8builds.dev/techforpros: a counted short link (lib/referrals.ts). */
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return refRedirect(request, 'techforpros')
}
