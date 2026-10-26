import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { DOWNLOADS, formatSize, latestAsset } from '@/lib/downloads'

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
