import { revalidateTag } from 'next/cache'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { logger } from '@/lib/logger'
import { SITE_URL } from '@/lib/seo'
import {
  SIGNATURE_HEADER_NAME,
  pathsForPayload,
  tagsForPayload,
  verifySanitySignature,
} from '@/lib/sanity-revalidate'

/**
 * Sanity's "Revalidate n8builds.dev" webhook (docs/SANITY.md): a post, page or
 * build log highlight was published, changed or unpublished. Signed with
 * SANITY_WEBHOOK_SECRET; anything unsigned, stale or wrongly signed is refused.
 */
export const dynamic = 'force-dynamic'

/** Long enough for the tag write to land before the pages are asked for. */
const WARM_DELAY_MS = 1500

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) {
    logger.error('[sanity-revalidate] SANITY_WEBHOOK_SECRET is not set')
    return Response.json({ error: 'Not configured' }, { status: 500 })
  }

  const body = await request.text()
  const check = await verifySanitySignature(
    body,
    request.headers.get(SIGNATURE_HEADER_NAME),
    secret
  )
  if (!check.ok) return Response.json({ error: 'Invalid signature' }, { status: 401 })

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const tags = tagsForPayload(payload)
  // Stale, not gone: a failed re-render keeps serving the last good page.
  for (const tag of tags) revalidateTag(tag, 'max')
  const warmed = tags.length ? warm(pathsForPayload(payload)) : []
  return Response.json({ revalidated: tags, warmed })
}

/**
 * Empties the Worker's edge cache (worker/edge-cache.js), which holds every
 * page as it was, so the next visitor gets the page Next renders afresh. Only
 * on Workers; `next start` has no edge cache.
 */
async function purgeEdgeCache(): Promise<void> {
  let exports: { CachedPages?: { purgeEverything(): Promise<unknown> } } | undefined
  try {
    exports = (getCloudflareContext().ctx as { exports?: typeof exports }).exports
  } catch {
    return
  }
  if (!exports?.CachedPages) return
  try {
    await exports.CachedPages.purgeEverything()
  } catch (error) {
    logger.error('[sanity-revalidate] the edge cache was not purged', error)
  }
}

/**
 * Empties the edge cache and asks the Worker itself for each page after the
 * response, so the stale copy is served to nobody but this request and the
 * queue renders the new one now.
 * Only on Workers (the self-reference binding); `next start` skips it.
 */
function warm(paths: string[]): string[] {
  let context: ReturnType<typeof getCloudflareContext>
  try {
    context = getCloudflareContext()
  } catch {
    return []
  }
  const { env } = context
  const ctx = context.ctx as { waitUntil(promise: Promise<unknown>): void }
  if (!env.WORKER_SELF_REFERENCE) return []
  const { host } = new URL(SITE_URL)
  ctx.waitUntil(
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, WARM_DELAY_MS))
      // After the tag write has landed, so no visitor can put the old page back.
      await purgeEdgeCache()
      if (!paths.length) return
      const results = await Promise.allSettled(
        paths.map((path) =>
          // The host header names the page to the revalidation queue.
          env.WORKER_SELF_REFERENCE.fetch(new URL(path, SITE_URL), { headers: { host } }).then(
            (response: Response) => response.body?.cancel()
          )
        )
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed) logger.warn(`[sanity-revalidate] ${failed} of ${paths.length} pages did not warm`)
    })()
  )
  return paths
}
