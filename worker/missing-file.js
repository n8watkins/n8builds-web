// A plain 404 for a path that cannot be a route, answered before Next starts.
//
// Scanners ask for /config.json, /.s3cfg, /www.zip, /terraform.tfvars and the
// like. Static files (public/, /_next/static) are served by Workers static
// assets before this Worker runs, so a file-like path that reaches it is a
// miss, and Next would spend a full render (about 100 to 150 ms of CPU) on the
// site's 404 page to say so.
//
// The rule is an allowlist plus a shape: a path with a dot in any segment (an
// extension, or a leading-dot name such as /.env) is answered here unless it is
// one of the routes below, which really have a dot in them. Paths without a
// dot, and /_next/image, never match, so the site's own 404 page still comes
// from Next for them.

/** The routes (app/) and well-known files whose paths contain a dot. */
const DOTTED_ROUTES = new Set([
  '/sitemap.xml', // app/sitemap.ts
  '/robots.txt', // public/
  '/security.txt', // redirect to /.well-known/security.txt (next.config.mjs)
  '/.well-known/security.txt', // public/.well-known/
  '/blog/rss.xml', // app/blog/rss.xml/route.ts
  '/builds/months.json', // app/builds/months.json/route.ts
  '/builds/og.png', // app/builds/og.png/route.ts
  '/games/og.png', // app/games/og.png/route.ts
])

/** Dynamic routes with a dot: the share images and the generated blog covers. */
const DOTTED_PATTERNS = [
  /^\/(?:blog|builds)\/[^/]+\/og\.png$/, // app/{blog,builds}/[slug]/og.png
  /^\/notions-cover\/[^/]+\/[^/]+\/[^/]+\.svg$/, // app/notions-cover/[version]/[topic]/[file]
]

/**
 * Whether a path is file-like (a dot in any segment) and not a known route.
 * @param {string} pathname
 */
export function isMissingFile(pathname) {
  if (!pathname.includes('.')) return false
  if (DOTTED_ROUTES.has(pathname)) return false
  return !DOTTED_PATTERNS.some((pattern) => pattern.test(pathname))
}

/**
 * The 404 for a missing file, or null for everything else. Small, no cookies,
 * and kept briefly by browsers and the edge so a scanner's repeat costs less.
 * @param {Request} request
 */
export function missingFileResponse(request) {
  if (!isMissingFile(new URL(request.url).pathname)) return null
  return new Response('Not found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  })
}
