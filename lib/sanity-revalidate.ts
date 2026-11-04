import { decodeSignatureHeader, encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

/**
 * Instant publish: Sanity calls /api/sanity/revalidate when a post, page or
 * build log highlight is published, changed or unpublished, and the site
 * expires every cached page and fetch that read that type of document.
 *
 * Every Sanity read in lib/sanity.ts carries the cache tag of the document
 * type it reads (`sanity:post`...), so one tag reaches the blog index, every
 * post, its share card, the feed, the sitemap and the homepage strip.
 *
 * The tag is marked stale (stale-while-revalidate), never dropped: a page
 * whose new render fails (Sanity or GitHub down) keeps its last good version
 * instead of answering with an error. So that nobody sees the old version,
 * the endpoint then asks for the pages that show the document itself
 * (`pathsForPayload`), which renders them afresh in the background.
 * Pages still revalidate hourly on their own, in case a webhook is missed.
 */

export { SIGNATURE_HEADER_NAME }

/** The document types the site reads, and the cache tag each one's reads carry. */
export const SANITY_TYPES = ['post', 'page', 'logEntry'] as const
export type SanityType = (typeof SANITY_TYPES)[number]

export const sanityTag = (type: SanityType) => `sanity:${type}`

const isSanityType = (value: unknown): value is SanityType =>
  typeof value === 'string' && (SANITY_TYPES as readonly string[]).includes(value)

/**
 * The tags to expire for a webhook body: the document's type, as projected by
 * the webhook (`{_id, _type, slug}`). Anything else (a type the site doesn't
 * read, a malformed body) expires nothing.
 */
export function tagsForPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return []
  const type = (payload as { _type?: unknown })._type
  return isSanityType(type) ? [sanityTag(type)] : []
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,95}$/

/**
 * The pages to render afresh right after a publish: the ones that show the
 * document. Other pages that read the same type (an older post's "More
 * notes") refresh on their next visit.
 */
export function pathsForPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return []
  const { _type: type, slug, build } = payload as { _type?: unknown; slug?: unknown; build?: unknown }
  if (type === 'post') {
    const post = typeof slug === 'string' && SLUG.test(slug) ? [`/blog/${slug}`, `/blog/${slug}/og.png`] : []
    return ['/blog', ...post, '/', '/blog/rss.xml', '/sitemap.xml']
  }
  if (type === 'logEntry') {
    return ['/builds', ...(typeof build === 'string' && SLUG.test(build) ? [`/builds/${build}`] : [])]
  }
  return []
}

/** Sanity signs `t=<ms>` into the header; older deliveries are refused as replays. */
export const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000

export type SignatureCheck = { ok: true } | { ok: false; reason: 'missing' | 'malformed' | 'stale' | 'invalid' }

/**
 * Checks Sanity's `sanity-webhook-signature` header (`t=<ms>,v1=<HMAC-SHA256
 * of "<t>.<body>", base64url>`) against the raw body: the signature must be
 * the one our secret makes, and no older than five minutes.
 */
export async function verifySanitySignature(
  body: string,
  header: string | null,
  secret: string,
  now = Date.now()
): Promise<SignatureCheck> {
  if (!header) return { ok: false, reason: 'missing' }
  let timestamp: number
  try {
    timestamp = decodeSignatureHeader(header).timestamp
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (Math.abs(now - timestamp) > MAX_SIGNATURE_AGE_MS) return { ok: false, reason: 'stale' }
  if (!body) return { ok: false, reason: 'malformed' }
  const expected = await encodeSignatureHeader(body, timestamp, secret)
  return timingSafeEqual(expected, header.trim()) ? { ok: true } : { ok: false, reason: 'invalid' }
}

/** Compares two strings in time that depends only on their length. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
