import { describe, expect, it } from 'vitest'
import { refuseGameOrigin } from '@/worker/game-gate.js'

function request(method: string, origin?: string, path = '/api/game') {
  return new Request(`https://n8builds.dev${path}`, { method, headers: origin ? { origin } : {} })
}

describe('refuseGameOrigin', () => {
  it('lets the listed sites post and preflight', () => {
    for (const origin of ['https://n8builds.dev', 'https://www.n8builds.dev', 'https://portfolio.n8builds.dev']) {
      expect(refuseGameOrigin(request('POST', origin), 'production')).toBeNull()
      expect(refuseGameOrigin(request('OPTIONS', origin), 'production')).toBeNull()
    }
  })

  it('refuses any other origin in production with the route’s 403', async () => {
    const post = refuseGameOrigin(request('POST', 'http://localhost:4829'), 'production')
    expect(post?.status).toBe(403)
    expect(await post?.json()).toEqual({ error: 'origin' })
    expect(refuseGameOrigin(request('POST'), 'production')?.status).toBe(403)
    expect(refuseGameOrigin(request('POST', 'constructor'), 'production')?.status).toBe(403)
    const preflight = refuseGameOrigin(request('OPTIONS', 'https://evil.example'), 'production')
    expect(preflight?.status).toBe(403)
    expect(await preflight?.text()).toBe('')
  })

  it('leaves other paths, other methods and non-production builds to the app', () => {
    expect(refuseGameOrigin(request('POST', 'http://localhost:4829', '/api/contact'), 'production')).toBeNull()
    expect(refuseGameOrigin(request('GET', 'http://localhost:4829'), 'production')).toBeNull()
    expect(refuseGameOrigin(request('POST', 'http://localhost:4829'), 'development')).toBeNull()
    expect(refuseGameOrigin(request('POST', 'http://localhost:4829'), undefined)).toBeNull()
  })
})
