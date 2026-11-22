// Workers static assets always answer with the whole file, but Safari on iOS
// and macOS plays a <video> only when the server honors byte ranges (206).
// wrangler.jsonc runs the worker first for the videos alone (run_worker_first),
// and this answers their Range requests. The clips are well under 2 MB, so
// slicing a buffered copy is cheap.
//
// The asset is always fetched whole and unconditionally, because Workers static
// assets leave Cache-Control off any answer to a Range request and send the
// whole body for a conditional one. So this answers the way a cache would
// (RFC 9110 13.2.2): a matching If-None-Match is a 304 before any Range is
// looked at, an If-Range that no longer matches gets the whole file, and the
// 206 carries the same Cache-Control and ETag as the 200.
// https://developers.cloudflare.com/workers/static-assets/headers/
// https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/#range-requests

/** Paths whose Range requests this answers; must match run_worker_first. */
export const MEDIA = /\.(mp4|webm)$/i

/**
 * Next's build output, every name carrying its content's hash (lib/media.ts):
 * the same rule public/_headers gives the files the Worker never sees, which
 * does not reach an answer the Worker makes.
 */
const HASHED = /^\/_next\/static\//
export const IMMUTABLE = 'public, max-age=31536000, immutable'

/** Headers a 304 keeps (RFC 9110 15.4.5). */
const NOT_MODIFIED_HEADERS = ['Cache-Control', 'ETag', 'Accept-Ranges', 'Vary', 'Content-Location', 'Date', 'Expires']

/**
 * Whether an If-None-Match value matches the ETag (weak comparison, RFC 9110 13.1.2).
 * @param {string} header
 * @param {string | null} etag
 */
export function noneMatch(header, etag) {
  if (header.trim() === '*') return true
  if (!etag) return false
  // Each entity tag is [W/]"<anything but a quote>", so a comma inside the quotes
  // belongs to the tag; only the quoted parts are compared.
  const opaque = (/** @type {string} */ tag) => /"[^"]*"/.exec(tag)?.[0]
  const wanted = opaque(etag)
  return [...header.matchAll(/(?:W\/)?"[^"]*"/g)].some(([tag]) => opaque(tag) === wanted)
}

/** What a clip answers to: the methods Workers static assets serve. */
export const ALLOW = 'GET, HEAD'

/**
 * Whether an If-Range value still names this file (strong comparison, RFC 9110 13.1.5).
 * @param {string} header
 * @param {Headers} headers the asset's own headers
 */
function rangeStillValid(header, headers) {
  const value = header.trim()
  if (value.startsWith('"')) return value === headers.get('ETag')
  if (value.startsWith('W/')) return false
  const lastModified = headers.get('Last-Modified')
  return lastModified !== null && Date.parse(value) === Date.parse(lastModified)
}

/**
 * The asset for `request`: a 304 when the browser's copy is current, a 206
 * slice when it asks for a byte range, the whole file otherwise.
 * @param {Request} request
 * @param {{ fetch: (request: Request) => Promise<Response> }} assets
 * @returns {Promise<Response>}
 */
export async function fetchWithRanges(request, assets) {
  // A static file takes GET and HEAD only; Workers static assets answer 405 to
  // the rest (a POST to the live site's CSS, 2026-11-22), and so does this.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: ALLOW, 'Content-Type': 'text/plain; charset=utf-8' } })
  }
  const asset = await assets.fetch(new Request(request.url, { method: request.method }))
  if (asset.status !== 200) return asset

  const headers = new Headers(asset.headers)
  headers.set('Accept-Ranges', 'bytes')
  if (HASHED.test(new URL(request.url).pathname)) headers.set('Cache-Control', IMMUTABLE)

  const ifNoneMatch = request.headers.get('If-None-Match')
  if (ifNoneMatch !== null && noneMatch(ifNoneMatch, headers.get('ETag'))) {
    await asset.body?.cancel()
    const kept = new Headers()
    for (const name of NOT_MODIFIED_HEADERS) {
      const value = headers.get(name)
      if (value !== null) kept.set(name, value)
    }
    return new Response(null, { status: 304, headers: kept })
  }

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range')?.trim() ?? '')
  const ifRange = request.headers.get('If-Range')
  if (
    request.method !== 'GET' ||
    !range ||
    (range[1] === '' && range[2] === '') ||
    (ifRange !== null && !rangeStillValid(ifRange, headers))
  ) {
    return new Response(asset.body, { status: 200, headers })
  }

  const body = await asset.arrayBuffer()
  const size = body.byteLength
  let start
  let end
  if (range[1] === '') {
    start = Math.max(0, size - Number(range[2]))
    end = size - 1
  } else {
    start = Number(range[1])
    end = range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1)
  }
  if (start >= size || start > end || (range[1] === '' && range[2] === '0')) {
    // Says how long the file is and nothing else: it is not the clip, so no type,
    // no ETag and no Cache-Control (a 416 is not cacheable without one, RFC 9110 15.1).
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' } })
  }

  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Content-Length', String(end - start + 1))
  return new Response(body.slice(start, end + 1), { status: 206, headers })
}
