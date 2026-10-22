import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy, securityHeaders, sentryCspReportUri } from '@/lib/security/headers.mjs'

function directive(csp: string, name: string): string | undefined {
  return csp.split(';').map((d) => d.trim()).find((d) => d === name || d.startsWith(`${name} `))
}

describe('sentryCspReportUri', () => {
  it('derives the security endpoint from a DSN', () => {
    expect(sentryCspReportUri('https://abc123@o4507.ingest.us.sentry.io/4508')).toBe(
      'https://o4507.ingest.us.sentry.io/api/4508/security/?sentry_key=abc123'
    )
  })

  it('returns null for a missing or malformed DSN', () => {
    expect(sentryCspReportUri(undefined)).toBeNull()
    expect(sentryCspReportUri('')).toBeNull()
    expect(sentryCspReportUri('not a url')).toBeNull()
    expect(sentryCspReportUri('https://o1.ingest.sentry.io/4508')).toBeNull()
  })
})

describe('buildContentSecurityPolicy', () => {
  it('never allows eval or websockets in production', () => {
    const csp = buildContentSecurityPolicy()
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-eval'")
    expect(directive(csp, 'connect-src')).not.toContain('ws:')
  })

  it('allows eval and the HMR websocket under next dev', () => {
    const csp = buildContentSecurityPolicy({ dev: true })
    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'")
    expect(directive(csp, 'connect-src')).toContain('ws:')
  })

  it('allows the Vercel toolbar only on preview deployments', () => {
    expect(buildContentSecurityPolicy()).not.toContain('vercel.live')
    const preview = buildContentSecurityPolicy({ preview: true })
    expect(directive(preview, 'script-src')).toContain('https://vercel.live')
    expect(directive(preview, 'frame-src')).toContain('https://vercel.live')
  })

  it('allows Turnstile, GA and the image hosts', () => {
    const csp = buildContentSecurityPolicy()
    expect(directive(csp, 'script-src')).toContain('https://challenges.cloudflare.com')
    expect(directive(csp, 'frame-src')).toContain('https://challenges.cloudflare.com')
    expect(directive(csp, 'script-src')).toContain('https://www.googletagmanager.com')
    expect(directive(csp, 'connect-src')).toContain('https://*.google-analytics.com')
    expect(directive(csp, 'img-src')).toContain('https://cdn.sanity.io')
  })

  it('adds reporting only when given an endpoint', () => {
    expect(directive(buildContentSecurityPolicy(), 'report-uri')).toBeUndefined()
    const csp = buildContentSecurityPolicy({ reportUri: 'https://example.com/report' })
    expect(directive(csp, 'report-uri')).toBe('report-uri https://example.com/report')
    expect(directive(csp, 'report-to')).toBe('report-to csp')
  })
})

describe('securityHeaders', () => {
  const byKey = (headers: { key: string; value: string }[]) => Object.fromEntries(headers.map((h) => [h.key, h.value]))

  it('sets the expected headers and drops X-XSS-Protection', () => {
    const headers = byKey(securityHeaders())
    expect(headers['Content-Security-Policy']).toBeTruthy()
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Permissions-Policy']).toContain('camera=()')
    expect(headers['X-XSS-Protection']).toBeUndefined()
    expect(headers['Reporting-Endpoints']).toBeUndefined()
  })

  it('wires CSP reports to Sentry when a DSN is set', () => {
    const headers = byKey(securityHeaders({ sentryDsn: 'https://key@o1.ingest.sentry.io/42' }))
    const endpoint = 'https://o1.ingest.sentry.io/api/42/security/?sentry_key=key'
    expect(headers['Reporting-Endpoints']).toBe(`csp="${endpoint}"`)
    expect(headers['Content-Security-Policy']).toContain(`report-uri ${endpoint}`)
  })
})
