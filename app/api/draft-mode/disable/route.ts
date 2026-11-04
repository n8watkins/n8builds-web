import { draftMode } from 'next/headers'
import { safePreviewPath } from '@/lib/preview'

/** Ends a draft preview and goes back to the page, now as everyone sees it. */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  ;(await draftMode()).disable()
  const path = safePreviewPath(new URL(request.url).searchParams.get('path'))
  return new Response(null, {
    status: 307,
    headers: { Location: path, 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' },
  })
}
