/**
 * Whether a build's live pages let this site frame them, for the live demo on
 * its page (owner, 2026-11-09). OpenPing and Solara send `frame-ancestors
 * 'none'` and `X-Frame-Options: DENY` until their own repos allow n8builds.dev
 * on their read-only public pages; a frame of a page that refuses shows the
 * browser's "refused to connect" error, so the page asks first and shows only
 * the views that would load, the clip standing in for the rest. The answer is
 * cached for an hour (like the build log), so an allowance deployed on the
 * product's side reaches the build page within the hour, with no change here.
 *
 * EMBED_FIXTURE answers without the network, for the E2E suite: `allow` (every
 * view frames; the specs stub the framed pages) or `deny`.
 */

/** This site's origin: the frame's ancestor the product must allow. */
const SITE = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://n8builds.dev').origin
  } catch {
    return 'https://n8builds.dev'
  }
})()

/** The value of one CSP directive from a Content-Security-Policy header (several policies, comma-joined, all apply). */
function directives(csp: string, name: string): string[][] {
  return csp
    .split(',')
    .map((policy) =>
      policy
        .split(';')
        .map((d) => d.trim().split(/\s+/))
        .find(([n]) => n?.toLowerCase() === name),
    )
    .filter((d): d is string[] => !!d)
    .map(([, ...sources]) => sources)
}

/** Whether one frame-ancestors source matches `origin` (https only; host wildcards match subdomains only). */
function sourceMatches(source: string, origin: string): boolean {
  const s = source.toLowerCase()
  if (s === '*' || s === 'https:') return true
  if (s === "'none'" || s === "'self'") return false
  const { protocol, host } = new URL(origin)
  const m = /^(?:(https?):\/\/)?(\*\.)?([^/:]+)(?::(\d+|\*))?\/?$/.exec(s)
  if (!m) return false
  const [, scheme, wildcard, sourceHost] = m
  if (scheme && `${scheme}:` !== protocol) return false
  return wildcard ? host.endsWith(`.${sourceHost}`) : host === sourceHost
}

/**
 * Whether a response with these headers may be framed by `origin`. A
 * `frame-ancestors` directive decides when there is one (browsers then ignore
 * X-Frame-Options); otherwise X-Frame-Options DENY or SAMEORIGIN refuses.
 */
export function framingAllowed(headers: Headers, origin = SITE): boolean {
  const ancestors = directives(headers.get('content-security-policy') ?? '', 'frame-ancestors')
  if (ancestors.length) return ancestors.every((sources) => sources.some((s) => sourceMatches(s, origin)))
  const xfo = headers.get('x-frame-options')?.trim().toLowerCase()
  return xfo !== 'deny' && xfo !== 'sameorigin'
}

/** Whether `url` can be framed on this site right now (cached an hour; false when it can't be reached). */
export async function canFrame(url: string): Promise<boolean> {
  const fixture = process.env.EMBED_FIXTURE
  if (fixture === 'allow') return true
  if (fixture === 'deny') return false
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) })
    // Only the headers matter, but the body is read so the cache can keep the response.
    await res.text()
    return res.ok && framingAllowed(res.headers)
  } catch {
    return false
  }
}
