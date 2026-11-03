// Workers static assets always answer with the whole file, but Safari on iOS
// and macOS plays a <video> only when the server honors byte ranges (206).
// wrangler.jsonc runs the worker first for the videos alone (run_worker_first),
// and this answers their Range requests. The clips are well under 1 MB, so
// slicing a buffered copy is cheap.

/** Paths whose Range requests this answers; must match run_worker_first. */
export const MEDIA = /\.(mp4|webm)$/i

/**
 * The asset for `request`, as a 206 slice when it asks for a byte range.
 * @param {Request} request
 * @param {{ fetch: (request: Request) => Promise<Response> }} assets
 * @returns {Promise<Response>}
 */
export async function fetchWithRanges(request, assets) {
  const asset = await assets.fetch(request)
  if (asset.status !== 200) return asset

  const headers = new Headers(asset.headers)
  headers.set('Accept-Ranges', 'bytes')
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range')?.trim() ?? '')
  if (request.method !== 'GET' || !range || (range[1] === '' && range[2] === '')) {
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
    headers.set('Content-Range', `bytes */${size}`)
    headers.delete('Content-Length')
    return new Response(null, { status: 416, headers })
  }

  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Content-Length', String(end - start + 1))
  return new Response(body.slice(start, end + 1), { status: 206, headers })
}
