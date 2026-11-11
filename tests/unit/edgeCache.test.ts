import { describe, expect, it } from 'vitest'
import { EDGE_STALE_SECONDS, MAX_EDGE_TTL_SECONDS, edgeTtl, forEdge, mayUseEdgeCache } from '@/worker/edge-cache.js'
import { MEDIA } from '@/worker/range.js'

const site = { host: 'n8builds.dev', uncachedPaths: MEDIA }

function request(path: string, init: RequestInit & { host?: string } = {}) {
  return new Request(`https://${init.host ?? 'n8builds.dev'}${path}`, init)
}

function response(cacheControl: string | null, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  if (cacheControl) headers.set('Cache-Control', cacheControl)
  return new Response('<html></html>', { ...init, headers })
}

describe('mayUseEdgeCache', () => {
  it('lets a visitor’s page view and the uptime check use the cache', () => {
    expect(mayUseEdgeCache(request('/'), site)).toBe(true)
    expect(mayUseEdgeCache(request('/builds', { method: 'HEAD' }), site)).toBe(true)
    expect(mayUseEdgeCache(request('/_next/image?url=%2Fa.png&w=640&q=75'), site)).toBe(true)
  })

  it('keeps form posts, other hosts, videos, drafts and revalidations away from it', () => {
    expect(mayUseEdgeCache(request('/api/contact', { method: 'POST' }), site)).toBe(false)
    expect(mayUseEdgeCache(request('/', { host: 'www.n8builds.dev' }), site)).toBe(false)
    expect(mayUseEdgeCache(request('/', { host: 'n8builds-web.example.workers.dev' }), site)).toBe(false)
    expect(mayUseEdgeCache(request('/videos/clip.mp4'), site)).toBe(false)
    expect(mayUseEdgeCache(request('/blog', { headers: { cookie: 'a=1; __prerender_bypass=x' } }), site)).toBe(false)
    expect(mayUseEdgeCache(request('/', { headers: { 'x-prerender-revalidate': 'id' } }), site)).toBe(false)
    expect(mayUseEdgeCache(request('/', { headers: { authorization: 'Bearer x' } }), site)).toBe(false)
  })

  it('ignores cookies that change nothing on the page', () => {
    expect(mayUseEdgeCache(request('/', { headers: { cookie: 'consent=yes' } }), site)).toBe(true)
  })
})

describe('edgeTtl', () => {
  it('keeps ISR and static pages for their revalidate time, capped at a day', () => {
    expect(edgeTtl(response('s-maxage=3600, stale-while-revalidate=31535400'))).toBe(3600)
    expect(edgeTtl(response('s-maxage=31536000'))).toBe(MAX_EDGE_TTL_SECONDS)
  })

  it('keeps public answers with a max-age, like the image optimizer’s', () => {
    expect(edgeTtl(response('public, max-age=14400, must-revalidate'))).toBe(14400)
  })

  it('never keeps private, dynamic, unmarked, cookie-setting, stale or failed answers', () => {
    expect(edgeTtl(response('private, no-cache, no-store, max-age=0, must-revalidate'))).toBe(0)
    expect(edgeTtl(response(null))).toBe(0)
    expect(edgeTtl(response('public, max-age=0'))).toBe(0)
    expect(edgeTtl(response('s-maxage=3600', { headers: { 'Set-Cookie': 'a=1' } }))).toBe(0)
    expect(edgeTtl(response('s-maxage=3600', { headers: { 'x-nextjs-cache': 'STALE' } }))).toBe(0)
    expect(edgeTtl(response('s-maxage=3600', { status: 404 }))).toBe(0)
  })
})

describe('forEdge', () => {
  it('tells only the edge how long to keep a page, and keeps the browser’s header', () => {
    const marked = forEdge(response('s-maxage=3600'))
    expect(marked.headers.get('Cloudflare-CDN-Cache-Control')).toBe(
      `public, max-age=3600, stale-while-revalidate=${EDGE_STALE_SECONDS}`
    )
    expect(marked.headers.get('Cache-Control')).toBe('s-maxage=3600')
  })

  it('marks everything else no-store, so the cache’s default rules never keep it', () => {
    expect(forEdge(response(null)).headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store')
  })
})
