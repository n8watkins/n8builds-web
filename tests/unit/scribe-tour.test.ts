import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Scribe's app tour (round 4 of 2026-11-02): small enough for the homepage,
 * and silent by construction, with no audio track at all, not just muted.
 */
const dir = path.join(process.cwd(), 'public/builds/scribe')
const file = (name: string) => readFileSync(path.join(dir, name))

describe("Scribe's tour", () => {
  it('stays under 1.5 MB in each format, and the poster is small', () => {
    for (const name of ['tour.webm', 'tour.mp4']) expect(statSync(path.join(dir, name)).size, name).toBeLessThan(1.5 * 1024 * 1024)
    expect(statSync(path.join(dir, 'tour-poster.webp')).size).toBeLessThan(120 * 1024)
  })

  it('has no audio track: the MP4 has only a video handler, the WebM no audio codec', () => {
    const mp4 = file('tour.mp4')
    // Each track's 'hdlr' box names its kind: 'vide' for video, 'soun' for audio.
    const handlers: string[] = []
    for (let i = mp4.indexOf('hdlr'); i !== -1; i = mp4.indexOf('hdlr', i + 4)) handlers.push(mp4.toString('latin1', i + 12, i + 16))
    expect(handlers).toContain('vide')
    expect(handlers).not.toContain('soun')
    const webm = file('tour.webm').toString('latin1')
    expect(webm).toContain('V_VP9')
    expect(webm).not.toMatch(/A_(OPUS|VORBIS|AAC|MPEG|PCM)/)
  })
})
