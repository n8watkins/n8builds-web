import { COVER_VERSION, coverSvg } from '@/lib/blog-cover'

// Generated blog covers: /notions-cover/v1/<topic>/<slug>.svg (see lib/blog-cover.ts).
// The output depends only on the URL, so it is cached for good; the version
// segment changes whenever the drawing does.

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ version: string; topic: string; file: string }> }
) {
  const { version, topic, file } = await params
  const slug = file.endsWith('.svg') ? file.slice(0, -4) : ''

  if (version !== COVER_VERSION || !SEGMENT.test(topic) || topic.length > 60 || !SEGMENT.test(slug) || slug.length > 120) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(coverSvg(topic, slug), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    },
  })
}
