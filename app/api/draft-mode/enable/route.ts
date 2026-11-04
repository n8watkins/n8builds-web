import { draftMode } from 'next/headers'
import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { sanity } from '@/lib/sanity'
import { safePreviewPath } from '@/lib/preview'

/**
 * Turns on draft previews for this browser, but only for a link made by the
 * Studio's "Preview" button: its `sanity-preview-secret` must match a secret
 * a signed-in Studio user wrote into the dataset in the last hour. Without
 * SANITY_VIEWER_TOKEN (the site's read token) previews are off.
 */
export const dynamic = 'force-dynamic'

const NO_INDEX = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  const token = process.env.SANITY_VIEWER_TOKEN
  if (!token) return new Response('Previews are not set up', { status: 404, headers: NO_INDEX })

  const { isValid, redirectTo } = await validatePreviewUrl(sanity.withConfig({ token }), request.url)
  if (!isValid) return new Response('This preview link is invalid or has expired', { status: 401, headers: NO_INDEX })

  ;(await draftMode()).enable()
  return new Response(null, { status: 307, headers: { ...NO_INDEX, Location: safePreviewPath(redirectTo) } })
}
