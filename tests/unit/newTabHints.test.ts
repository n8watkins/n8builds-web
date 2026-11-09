import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * A link that opens a new tab says so to screen readers, and a link that
 * stays in this tab never claims it opens one (owner, round 7 of 2026-11-09:
 * some links always said "(opens in a new tab)" while only their external
 * hrefs opened one). This reads every link element in the source:
 *
 * - `target="_blank"` on every render: the link carries the hint (an sr-only
 *   "(opens in a new tab)", or it in its aria-label);
 * - a new tab only for some hrefs (`{...(external ? { target: '_blank' } : {})}`,
 *   `{...away(href)}`): the hint is there and is conditional too (`&&`, `? :`);
 * - no target: no hint.
 *
 * A component whose hint comes from its caller's children marks itself with
 * a `new-tab-hint: from children` comment.
 */
const files = globSync('{app,components}/**/*.tsx')

type Mismatch = string

/** Every `<a ...>...</a>` and `<Link ...>...</Link>` block in a file, with its line. */
function links(source: string): { block: string; line: number }[] {
  const found: { block: string; line: number }[] = []
  for (const m of source.matchAll(/<(a|Link)\b[\s\S]*?<\/\1>/g)) {
    // Comments don't count: one may well mention "a new tab".
    const block = m[0].replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '')
    // A component whose hint comes from its children says so in a comment.
    found.push({ block: m[0].includes('new-tab-hint: from children') ? '' : block, line: source.slice(0, m.index).split('\n').length })
  }
  return found
}

function targetKind(block: string): 'always' | 'conditional' | 'never' {
  if (/\{\.\.\.\(?\s*\w+\(/.test(block) && /away\(|newTab\(/.test(block)) return 'conditional'
  if (/\{\.\.\.\([\s\S]{0,120}?\?[\s\S]{0,60}?_blank/.test(block)) return 'conditional'
  if (/target=\{[^}]*\?\s*'_blank'/.test(block)) return 'conditional'
  if (/target="_blank"/.test(block)) return 'always'
  return 'never'
}

function hintKind(block: string): 'always' | 'conditional' | 'none' {
  const lines = block.split('\n')
  const at = lines.findIndex((l) => /new tab/i.test(l))
  if (at === -1) return 'none'
  const line = lines[at]
  if (/&&|\s\?\s/.test(line)) return 'conditional'
  // Inside a `{cond ? (` or `{cond && (` block opened a few lines above.
  for (let i = at - 1; i >= Math.max(0, at - 4); i--) {
    if (/(\?|&&)\s*\(\s*$/.test(lines[i])) return 'conditional'
  }
  return 'always'
}

function mismatches(file: string): Mismatch[] {
  const out: Mismatch[] = []
  for (const { block, line } of links(readFileSync(file, 'utf8'))) {
    if (!block) continue
    const target = targetKind(block)
    const hint = hintKind(block)
    if (target === 'always' && hint === 'none') out.push(`${file}:${line} opens a new tab without saying so`)
    if (target === 'never' && hint !== 'none') out.push(`${file}:${line} says it opens a new tab but doesn't`)
    if (target === 'conditional' && hint !== 'conditional')
      out.push(`${file}:${line} opens a new tab only sometimes, but ${hint === 'none' ? 'never says so' : 'always says so'}`)
  }
  return out
}

describe('new-tab hints', () => {
  it('finds the links', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('every link says whether it opens a new tab, and only when it does', () => {
    expect(files.flatMap(mismatches)).toEqual([])
  })

  it('catches a hint on a link that only sometimes opens a new tab', () => {
    const block = `<a href={x} {...away(x)}>Go<span className="sr-only"> (opens in a new tab)</span></a>`
    expect(targetKind(block)).toBe('conditional')
    expect(hintKind(block)).toBe('always')
  })
})
