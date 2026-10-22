/**
 * Generated blog covers ("signal" art) for posts without an uploaded image.
 *
 * A waveform field seeded by the post slug (unique per post, identical on every
 * render) in the accent colour of the post's first topic (consistent per topic).
 * Served as a cached SVG file by app/notions-cover/[version]/[topic]/[file]/route.ts,
 * so pages only carry an <img> tag.
 *
 * The art is a pure function of (topic, slug), and neither value is written into
 * the SVG, so any URL produces a valid image and nothing can be injected.
 * Bump COVER_VERSION whenever the drawing changes: the files are cached forever.
 */

export const COVER_VERSION = 'v1'

// Site palette only (blue/cyan family plus emerald and amber; no purple).
const ACCENTS = ['#22d3ee', '#60a5fa', '#34d399', '#fbbf24', '#38bdf8', '#2dd4bf'] as const

const TOPIC_ACCENTS: Record<string, (typeof ACCENTS)[number]> = {
  'building-in-public': '#22d3ee',
  'ai-coding': '#60a5fa',
  growth: '#34d399',
  startup: '#fbbf24',
  predictions: '#38bdf8',
}

/** Placeholder topic segment for posts without one. */
export const NO_TOPIC = 'notes'

const W = 640
const H = 360
const LINES = 7
const SAMPLES = 24

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Small deterministic PRNG (mulberry32). */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function coverAccent(topic: string | undefined, slug: string): string {
  if (topic && TOPIC_ACCENTS[topic]) return TOPIC_ACCENTS[topic]
  return ACCENTS[hash(topic && topic !== NO_TOPIC ? topic : slug) % ACCENTS.length]
}

export function coverUrl(topic: string | undefined, slug: string): string {
  return `/notions-cover/${COVER_VERSION}/${encodeURIComponent(topic || NO_TOPIC)}/${encodeURIComponent(slug)}.svg`
}

/** Smooth path through the points (Catmull-Rom as cubic Béziers), so few samples still draw clean curves. */
function smoothPath(points: [number, number][]) {
  const r = (n: number) => Math.round(n * 10) / 10
  let d = `M${r(points[0][0])} ${r(points[0][1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[Math.max(i - 1, 0)]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const [x3, y3] = points[Math.min(i + 2, points.length - 1)]
    d += `C${r(x1 + (x2 - x0) / 6)} ${r(y1 + (y2 - y0) / 6)} ${r(x2 - (x3 - x1) / 6)} ${r(y2 - (y3 - y1) / 6)} ${r(x2)} ${r(y2)}`
  }
  return d
}

/** The cover as a standalone SVG document. */
export function coverSvg(topic: string | undefined, slug: string): string {
  const accent = coverAccent(topic, slug)
  const rand = random(hash(slug))
  const lead = Math.floor(LINES / 2)
  const cursorAt = Math.floor(SAMPLES * (0.55 + rand() * 0.3))
  let cursor: [number, number] = [0, 0]
  const paths: string[] = []

  for (let i = 0; i < LINES; i++) {
    const base = H * 0.18 + (i * H * 0.6) / (LINES - 1)
    const amp = (i === lead ? 34 : 10) + rand() * 22
    const freq = 1.2 + rand() * 2.4
    const phase = rand() * Math.PI * 2
    const harmonic = 0.25 + rand() * 0.35
    const points: [number, number][] = []
    for (let s = 0; s <= SAMPLES; s++) {
      const t = s / SAMPLES
      // Taper toward the left edge so the signal "starts" off-canvas.
      const envelope = 0.35 + 0.65 * Math.sin(Math.min(t * 1.6, 1) * (Math.PI / 2))
      const wave = Math.sin(t * freq * Math.PI * 2 + phase) + harmonic * Math.sin(t * freq * 5.3 * Math.PI + phase * 1.7)
      points.push([t * W, base + envelope * amp * wave])
      if (i === lead && s === cursorAt) cursor = points[s]
    }
    const d = smoothPath(points)
    if (i === lead) {
      paths.push(
        `<path d="${d}" stroke="${accent}" stroke-opacity="0.25" stroke-width="7"/>`,
        `<path d="${d}" stroke="${accent}" stroke-opacity="0.95" stroke-width="2"/>`
      )
    } else {
      paths.push(`<path d="${d}" stroke="#fff" stroke-opacity="${((0.45 - Math.abs(i - lead) * 0.1) * 0.5).toFixed(3)}"/>`)
    }
  }

  const [cx, cy] = cursor.map((n) => Math.round(n * 10) / 10)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`,
    '<defs>',
    `<radialGradient id="g" cx="78%" cy="18%" r="75%"><stop offset="0" stop-color="${accent}" stop-opacity="0.28"/><stop offset="0.55" stop-color="${accent}" stop-opacity="0.06"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>`,
    '<pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#fff" stroke-opacity="0.05"/></pattern>',
    '</defs>',
    `<rect width="${W}" height="${H}" fill="#050812"/>`,
    `<rect width="${W}" height="${H}" fill="url(#g)"/>`,
    `<rect width="${W}" height="${H}" fill="url(#p)"/>`,
    `<g fill="none" stroke-linecap="round">${paths.join('')}</g>`,
    `<line x1="${cx}" x2="${cx}" y2="${H}" stroke="${accent}" stroke-opacity="0.18" stroke-dasharray="3 5"/>`,
    `<circle cx="${cx}" cy="${cy}" r="10" fill="${accent}" fill-opacity="0.15"/>`,
    `<circle cx="${cx}" cy="${cy}" r="4" fill="${accent}"/>`,
    '</svg>',
  ].join('')
}
