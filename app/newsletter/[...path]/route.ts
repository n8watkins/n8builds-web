import { NextRequest, NextResponse } from 'next/server'

/**
 * The self-sent newsletter's old confirm and unsubscribe pages
 * (/newsletter/confirm?t=..., /newsletter/unsubscribe?t=...): Kit has its own
 * now (lib/newsletter/kit.ts), so they lead to the blog. A route rather than a
 * next.config redirect, which would carry the old token along in the query.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/blog', request.url), 307)
}
