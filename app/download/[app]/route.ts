import { DOWNLOADS, latestAsset, releasesPage } from '@/lib/downloads'

/**
 * n8builds.dev/download/<app>: a short, shareable link that always starts the
 * newest installer. Falls back to the releases page, so it never dead-ends.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ app: string }> }) {
  const { app } = await params
  const download = DOWNLOADS[app]
  if (!download) return new Response('Not found', { status: 404 })
  const asset = await latestAsset(download)
  return new Response(null, {
    status: 307,
    headers: {
      Location: asset?.url ?? releasesPage(download),
      // Browsers and the CDN may reuse it briefly; a new release shows up within minutes.
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
  })
}
