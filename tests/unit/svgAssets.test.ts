import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Every SVG in public/ must be well-formed XML: a browser draws nothing at all
 * for one that isn't. The Gemini, Turso and Cloudflare icons once declared
 * xmlns twice on their root tag and silently showed as broken images.
 */
const files = globSync('public/**/*.svg')

/** Attribute names repeated within one tag (an XML error). */
function duplicateAttributes(svg: string): string[] {
  const dupes: string[] = []
  for (const [tag] of svg.matchAll(/<[A-Za-z][^>]*>/g)) {
    const seen = new Set<string>()
    for (const [, name] of tag.matchAll(/\s([A-Za-z_:][\w:.-]*)\s*=/g)) {
      if (seen.has(name)) dupes.push(`${name} in ${tag.slice(0, 40)}...`)
      seen.add(name)
    }
  }
  return dupes
}

describe('SVG assets', () => {
  it('finds the icons', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it.each(files)('%s has no repeated attributes', (file) => {
    expect(duplicateAttributes(readFileSync(file, 'utf8'))).toEqual([])
  })

  it('catches a repeated xmlns', () => {
    expect(duplicateAttributes('<svg xmlns="a" fill="b" xmlns="a"><path d="M0"/></svg>')).toHaveLength(1)
  })
})
