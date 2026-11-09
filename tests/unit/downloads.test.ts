import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { DOWNLOADS, formatSize, latestAsset, scribeDownloads } from '@/lib/downloads'
import { detectPlatform } from '@/hooks/usePlatform'

describe('formatSize', () => {
  it('shows sizes the way Windows does, in binary megabytes', () => {
    expect(formatSize(12519464)).toBe('12 MB')
    expect(formatSize(30674944)).toBe('29 MB')
    expect(formatSize(1258291)).toBe('1.2 MB')
  })
})

describe('latestAsset', () => {
  const before = process.env.BUILD_LOG_FIXTURE
  beforeEach(() => {
    process.env.BUILD_LOG_FIXTURE = '1'
  })
  afterEach(() => {
    if (before === undefined) delete process.env.BUILD_LOG_FIXTURE
    else process.env.BUILD_LOG_FIXTURE = before
  })

  it("picks Scribe's NSIS installer, with its version and size", async () => {
    expect(await latestAsset(DOWNLOADS.scribe)).toEqual({
      url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe_0.8.0_x64-setup.exe',
      version: 'v0.8.0',
      size: 12519464,
    })
  })
})

describe('Scribe on every desktop OS (2026-11-09)', () => {
  const before = process.env.BUILD_LOG_FIXTURE
  beforeEach(() => {
    process.env.BUILD_LOG_FIXTURE = '1'
  })
  afterEach(() => {
    if (before === undefined) delete process.env.BUILD_LOG_FIXTURE
    else process.env.BUILD_LOG_FIXTURE = before
  })

  it('finds the Mac and Linux files by their type', async () => {
    expect((await latestAsset(DOWNLOADS['scribe-mac']))?.url).toMatch(/\.dmg$/)
    expect((await latestAsset(DOWNLOADS['scribe-linux']))?.url).toMatch(/\.AppImage$/)
    expect((await latestAsset(DOWNLOADS['scribe-deb']))?.url).toMatch(/\.deb$/)
  })

  it('marks Mac and Linux as beta, with the Mac first-run step and the .deb beside the AppImage', async () => {
    const all = await scribeDownloads()
    expect(all.windows).toEqual({ href: '/download/scribe', facts: 'Windows 10 and 11, 64-bit · v0.8.0 · 12 MB', beta: false })
    expect(all.mac.href).toBe('/download/scribe-mac')
    expect(all.mac.facts).toMatch(/^macOS, Apple silicon and Intel · v0\.8\.0 · /)
    expect(all.mac.note).toBe('Not notarized by Apple: open it once, then allow it in System Settings > Privacy & Security > Open Anyway.')
    expect(all.linux).toMatchObject({ href: '/download/scribe-linux', beta: true, alt: { href: '/download/scribe-deb', label: '.deb' } })
    expect(all.linux.facts).toMatch(/^Linux, 64-bit AppImage · v0\.8\.0 · /)
  })
})

describe('detectPlatform', () => {
  const ua = {
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
    android: 'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36',
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  }
  it('reads the user agent, an iPad (a Mac with touch) and Android as other', () => {
    expect(detectPlatform({ userAgent: ua.windows, maxTouchPoints: 0 })).toBe('windows')
    expect(detectPlatform({ userAgent: ua.mac, maxTouchPoints: 0 })).toBe('mac')
    expect(detectPlatform({ userAgent: ua.mac, maxTouchPoints: 5 })).toBe('other')
    expect(detectPlatform({ userAgent: ua.linux, maxTouchPoints: 0 })).toBe('linux')
    expect(detectPlatform({ userAgent: ua.android, maxTouchPoints: 5 })).toBe('other')
    expect(detectPlatform({ userAgent: ua.iphone, maxTouchPoints: 5 })).toBe('other')
  })
  it('prefers the client hint', () => {
    expect(detectPlatform({ userAgent: ua.windows, maxTouchPoints: 0, userAgentData: { platform: 'macOS' } })).toBe('mac')
    expect(detectPlatform({ userAgent: ua.linux, maxTouchPoints: 0, userAgentData: { platform: 'Linux' } })).toBe('linux')
    expect(detectPlatform({ userAgent: ua.android, maxTouchPoints: 5, userAgentData: { platform: 'Android', mobile: true } })).toBe('other')
  })
})
