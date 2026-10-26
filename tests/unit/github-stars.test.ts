import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatStars, repoFromUrl, repoStars } from '@/lib/github-stars'

describe('repoFromUrl', () => {
  it('reads owner/name from a GitHub repo URL', () => {
    expect(repoFromUrl('https://github.com/n8watkins/scribe')).toBe('n8watkins/scribe')
    expect(repoFromUrl('https://github.com/n8watkins/open-ping/')).toBe('n8watkins/open-ping')
    expect(repoFromUrl('https://github.com/n8watkins/n8builds-web.git')).toBe('n8watkins/n8builds-web')
  })
  it('rejects anything else', () => {
    expect(repoFromUrl('https://github.com/n8watkins')).toBeNull()
    expect(repoFromUrl('https://github.com/n8watkins/scribe/issues')).toBeNull()
    expect(repoFromUrl('https://gitlab.com/n8watkins/scribe')).toBeNull()
  })
})

describe('formatStars', () => {
  it('shows small counts as they are and thousands with a k', () => {
    expect(formatStars(0)).toBe('0')
    expect(formatStars(999)).toBe('999')
    expect(formatStars(1234)).toBe('1.2k')
    expect(formatStars(12_345)).toBe('12k')
  })
})

describe('repoStars', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("returns the repo's stargazer count, cached for an hour", async () => {
    vi.stubEnv('BUILD_LOG_FIXTURE', '')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ stargazers_count: 42 })))
    vi.stubGlobal('fetch', fetchMock)
    await expect(repoStars('n8watkins/scribe')).resolves.toBe(42)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/n8watkins/scribe')
    expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 3600 })
  })

  it('returns null when GitHub fails or answers oddly, so the button shows no count', async () => {
    vi.stubEnv('BUILD_LOG_FIXTURE', '')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 403 })))
    await expect(repoStars('n8watkins/scribe')).resolves.toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}))))
    await expect(repoStars('n8watkins/scribe')).resolves.toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(repoStars('n8watkins/scribe')).resolves.toBeNull()
  })

  it('never calls GitHub under the E2E fixture', async () => {
    vi.stubEnv('BUILD_LOG_FIXTURE', '1')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(repoStars('n8watkins/scribe')).resolves.toBe(1234)
    await expect(repoStars('n8watkins/open-ping')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
