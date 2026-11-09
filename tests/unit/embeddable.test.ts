import { afterEach, describe, expect, it, vi } from 'vitest'
import { canFrame, framingAllowed } from '@/lib/embeddable'

const SITE = 'https://n8builds.dev'
const headers = (h: Record<string, string>) => new Headers(h)

describe('framingAllowed', () => {
  it("refuses what OpenPing and Solara send today: frame-ancestors 'none' and X-Frame-Options DENY", () => {
    expect(framingAllowed(headers({ 'content-security-policy': "default-src 'self'; frame-ancestors 'none'", 'x-frame-options': 'DENY' }), SITE)).toBe(false)
    expect(framingAllowed(headers({ 'x-frame-options': 'DENY' }), SITE)).toBe(false)
    expect(framingAllowed(headers({ 'x-frame-options': 'SAMEORIGIN' }), SITE)).toBe(false)
  })

  it('allows the bare domain only when it is listed: a *. wildcard matches subdomains only', () => {
    const openping = "default-src 'self'; frame-ancestors 'self' https://n8builds.dev https://*.n8builds.dev; object-src 'none'"
    expect(framingAllowed(headers({ 'content-security-policy': openping }), SITE)).toBe(true)
    expect(framingAllowed(headers({ 'content-security-policy': 'frame-ancestors https://*.n8builds.dev' }), SITE)).toBe(false)
    expect(framingAllowed(headers({ 'content-security-policy': 'frame-ancestors https://*.n8builds.dev' }), 'https://www.n8builds.dev')).toBe(true)
    expect(framingAllowed(headers({ 'content-security-policy': 'frame-ancestors n8builds.dev' }), SITE)).toBe(true)
    expect(framingAllowed(headers({ 'content-security-policy': 'frame-ancestors http://n8builds.dev' }), SITE)).toBe(false)
    expect(framingAllowed(headers({ 'content-security-policy': 'frame-ancestors https://evil-n8builds.dev' }), SITE)).toBe(false)
  })

  it('lets frame-ancestors decide over X-Frame-Options, as browsers do', () => {
    expect(framingAllowed(headers({ 'content-security-policy': 'frame-ancestors https://n8builds.dev', 'x-frame-options': 'DENY' }), SITE)).toBe(true)
  })

  it('needs every policy to allow it when there are several', () => {
    expect(framingAllowed(headers({ 'content-security-policy': "frame-ancestors https://n8builds.dev, frame-ancestors 'none'" }), SITE)).toBe(false)
  })

  it('allows a page that says nothing about framing', () => {
    expect(framingAllowed(headers({}), SITE)).toBe(true)
    expect(framingAllowed(headers({ 'content-security-policy': "default-src 'self'" }), SITE)).toBe(true)
  })
})

describe('canFrame', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('asks the page itself, cached for an hour', async () => {
    vi.stubEnv('EMBED_FIXTURE', '')
    const fetchMock = vi.fn().mockResolvedValue(new Response('<!doctype html>', { headers: { 'content-security-policy': 'frame-ancestors https://n8builds.dev' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(canFrame('https://openping.n8builds.dev/status')).resolves.toBe(true)
    expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 3600 })
  })

  it('says no when the page refuses, errors or is down', async () => {
    vi.stubEnv('EMBED_FIXTURE', '')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { headers: { 'x-frame-options': 'DENY' } })))
    await expect(canFrame('https://openping.n8builds.dev/status')).resolves.toBe(false)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    await expect(canFrame('https://openping.n8builds.dev/status')).resolves.toBe(false)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(canFrame('https://openping.n8builds.dev/status')).resolves.toBe(false)
  })

  it('answers from EMBED_FIXTURE without the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('EMBED_FIXTURE', 'allow')
    await expect(canFrame('https://openping.n8builds.dev/status')).resolves.toBe(true)
    vi.stubEnv('EMBED_FIXTURE', 'deny')
    await expect(canFrame('https://openping.n8builds.dev/status')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
