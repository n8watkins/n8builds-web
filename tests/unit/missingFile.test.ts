import { describe, expect, it } from 'vitest'
import { isMissingFile, missingFileResponse } from '@/worker/missing-file.js'

const at = (path: string, init?: RequestInit) => new Request(`https://n8builds.dev${path}`, init)

describe('isMissingFile', () => {
  it('lets every real route through, dotted or not', () => {
    for (const path of [
      '/',
      '/builds',
      '/builds/portfolio',
      '/blog/some-post',
      '/api/contact',
      '/api/health',
      '/monitoring',
      '/healthz',
      '/download/scribe',
      '/_next/image',
      '/does-not-exist',
      '/sitemap.xml',
      '/robots.txt',
      '/security.txt',
      '/.well-known/security.txt',
      '/blog/rss.xml',
      '/builds/months.json',
      '/builds/og.png',
      '/games/og.png',
      '/builds/portfolio/og.png',
      '/blog/some-post/og.png',
      '/notions-cover/v1/design/some-post.svg',
    ]) {
      expect(isMissingFile(path), path).toBe(false)
    }
  })

  it('refuses file-like paths that are not routes', () => {
    for (const path of [
      '/config.json',
      '/.s3cfg',
      '/secrets.json',
      '/www.zip',
      '/terraform.tfvars',
      '/vercel.json',
      '/.env',
      '/.git/config',
      '/.well-known/other.txt',
      '/wp-login.php',
      '/backup/db.sql',
      '/images/gone.png',
      '/_next/static/chunks/gone.js',
      '/builds/portfolio/other.png',
      '/blog/x/y/og.png',
      '/notions-cover/v1/design/some-post.png',
      '/sitemap.xml.bak',
    ]) {
      expect(isMissingFile(path), path).toBe(true)
    }
  })
})

describe('missingFileResponse', () => {
  it('is a small, cookie-free, briefly cached 404 for a probe, whatever the method', async () => {
    for (const method of ['GET', 'HEAD', 'POST']) {
      const response = missingFileResponse(at('/config.json', { method }))
      expect(response?.status).toBe(404)
      expect(response?.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(response?.headers.get('cache-control')).toBe('public, max-age=60, s-maxage=300')
      expect(response?.headers.has('set-cookie')).toBe(false)
    }
    expect(await missingFileResponse(at('/.s3cfg'))?.text()).toBe('Not found')
  })

  it('leaves everything else to Next, including its own 404 page', () => {
    expect(missingFileResponse(at('/nope'))).toBeNull()
    expect(missingFileResponse(at('/blog/rss.xml'))).toBeNull()
  })
})
