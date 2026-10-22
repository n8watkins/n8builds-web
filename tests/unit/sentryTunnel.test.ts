import { beforeEach, describe, expect, it, vi } from 'vitest'

const DSN = 'https://publickey@o111.ingest.us.sentry.io/222'

async function loadRoute(dsn: string | undefined) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', dsn ?? '')
  return import('@/app/monitoring/route')
}

function envelope(dsn: string, item = '{"type":"event"}\n{}') {
  return new Request('http://localhost/monitoring', {
    method: 'POST',
    body: `${JSON.stringify({ dsn, sent_at: '2026-10-22T00:00:00Z' })}\n${item}`,
  })
}

const upstream = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 200 }))

beforeEach(() => {
  upstream.mockClear()
  vi.stubGlobal('fetch', upstream)
})

describe('/monitoring Sentry tunnel', () => {
  it("forwards envelopes for the site's own project", async () => {
    const { POST } = await loadRoute(DSN)
    const response = await POST(envelope(DSN))

    expect(response.status).toBe(200)
    expect(upstream).toHaveBeenCalledOnce()
    expect(upstream.mock.calls[0][0]).toBe('https://o111.ingest.us.sentry.io/api/222/envelope/')
  })

  it('refuses other projects and other orgs (no open relay)', async () => {
    const { POST } = await loadRoute(DSN)

    expect((await POST(envelope('https://k@o111.ingest.us.sentry.io/999'))).status).toBe(400)
    expect((await POST(envelope('https://k@o999.ingest.de.sentry.io/222'))).status).toBe(400)
    expect((await POST(envelope('https://k@evil.example/222'))).status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('refuses malformed envelopes', async () => {
    const { POST } = await loadRoute(DSN)
    const response = await POST(new Request('http://localhost/monitoring', { method: 'POST', body: 'not json' }))

    expect(response.status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('is off without a DSN', async () => {
    const { POST } = await loadRoute(undefined)

    expect((await POST(envelope(DSN))).status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })
})
