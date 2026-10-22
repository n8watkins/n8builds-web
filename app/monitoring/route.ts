// Sentry tunnel: the browser SDK posts envelopes here (same origin, so ad
// blockers and the CSP allow them) and we forward them to Sentry.
//
// This replaces @sentry/nextjs's `tunnelRoute` rewrite, which forwards to any
// Sentry org and project named in the query string, making the site an open
// relay. Here an envelope is forwarded only if its DSN is this site's own.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

function parseDsn(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    const projectId = url.pathname.replace(/^\/+|\/+$/g, '')
    return /^\d+$/.test(projectId) ? { host: url.host, projectId } : null
  } catch {
    return null
  }
}

const ours = parseDsn(dsn)

export async function POST(request: Request) {
  if (!ours) return new Response(null, { status: 404 })

  // An envelope is a JSON header line followed by items, which may be binary
  // (compressed replays), so only the first line is decoded.
  const body = new Uint8Array(await request.arrayBuffer())
  const newline = body.indexOf(0x0a)
  let target
  try {
    const header = JSON.parse(new TextDecoder().decode(newline === -1 ? body : body.subarray(0, newline)))
    target = parseDsn(header.dsn)
  } catch {
    target = null
  }
  if (!target || target.host !== ours.host || target.projectId !== ours.projectId) {
    return new Response(null, { status: 400 })
  }

  const upstream = await fetch(`https://${ours.host}/api/${ours.projectId}/envelope/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body,
  })
  return new Response(null, { status: upstream.status })
}
