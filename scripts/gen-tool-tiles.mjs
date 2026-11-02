// Makes the build log's tiles for my own tools (public/log/<tool>.svg): each
// tool's one mark (OWN_TOOL_ICONS in data/loadout.tsx, round 2 of 2026-11-02)
// in cyan on a dark rounded tile, the shape of the app icons beside them in
// the log. None of these tools has a logo of its own.
//
//   node scripts/gen-tool-tiles.mjs
//
// Keep TOOLS in step with OWN_TOOL_ICONS; tests/unit/build-log-repos.test.ts
// checks every tracked tool has its tile.

import { mkdirSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LuGauge, LuKeyRound, LuNewspaper, LuTag } from 'react-icons/lu'

const TOOLS = { devguard: LuGauge, 'pass-env': LuKeyRound, 'release-kit': LuTag, 'pr-post': LuNewspaper }

mkdirSync('public/log', { recursive: true })
for (const [name, Icon] of Object.entries(TOOLS)) {
  // The glyph's own <svg> (a 24-unit box), placed in the middle 36 of the tile's 64.
  const glyph = renderToStaticMarkup(createElement(Icon, { size: 36, color: '#67e8f9', x: 14, y: 14 }))
    .replace(/ style="[^"]*"/, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0b1a2b"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" fill="none" stroke="#67e8f9" stroke-opacity="0.22" stroke-width="1.5"/>
  ${glyph}
</svg>
`
  writeFileSync(`public/log/${name}.svg`, svg)
  console.log(`public/log/${name}.svg`)
}
