import type { GameTheme } from './types'

/**
 * The n8games look (owner-approved preview, round two): a deep navy ground, warm
 * cards and stickers, tomato for Play. Each game page adds a touch of its own on
 * top (owner, 2026-11-16: "a little bit of Cork and Bell style ... I'm not saying
 * go crazy"): its own ground and card, a title plate, sticker and step colours,
 * and a heading face, while the layout stays the family's.
 *
 * The colours live here, not only in CSS, so a unit test can hold every text pair
 * to 4.5:1 (tests/unit/n8games.test.ts). The textures are in n8games.module.css.
 */
export interface Palette {
  /** The page's ground and the dots on it. */
  ground: string
  groundDot: string
  /** A quiet panel (credits, ledes), and a card (steps, notes). */
  plate: string
  card: string
  ink: string
  inkSoft: string
  line: string
  /** The title plate (h1). */
  titlePlate: string
  onTitlePlate: string
  /** The second word of the title, on the plate. */
  titleAccent: string
  /** Section stickers. */
  sticker: string
  onSticker: string
  /** The numbered step roundels. */
  step: string
  onStep: string
  /** Icons and borders (3:1 is enough for those, but they stay text-safe). */
  accent: string
  /** Play: the main button. */
  play: string
  onPlay: string
  /** The status chip ("Playable"). */
  chip: string
  onChip: string
  focus: string
}

/** The family's own colours: the n8games page, and the base of every game page. */
export const BASE: Palette = {
  ground: '#0a1230',
  groundDot: '#0f1a40',
  plate: '#111c46',
  card: '#17255a',
  ink: '#fff3e0',
  inkSoft: '#b8c3ea',
  line: '#31428a',
  // A shade deeper than Play's tomato, so the yellow "games" on it reads at 4.9:1 (the preview's was 3.7:1).
  titlePlate: '#a8321c',
  onTitlePlate: '#fff6ea',
  titleAccent: '#ffd977',
  sticker: '#f7c24a',
  onSticker: '#2a1606',
  step: '#f7c24a',
  onStep: '#2a1606',
  accent: '#f7c24a',
  play: '#c93d24',
  onPlay: '#fff6ea',
  chip: '#24774b',
  onChip: '#ffffff',
  focus: '#9cc0ff',
}

export const THEMES: Record<GameTheme, Palette> = {
  // 1930s fairground at dusk: oxblood and cream, gilt edges, bunting (Cork & Bell's README: "oxblood, bottle green, navy, cream", gold lettering).
  cork: {
    ...BASE,
    ground: '#0b1029',
    groundDot: '#121a3d',
    card: '#1a2050',
    titlePlate: '#7d1c14',
    onTitlePlate: '#fbefd9',
    titleAccent: '#f2c45a',
    sticker: '#f2c45a',
    onSticker: '#3a1208',
    step: '#fbefd9',
    onStep: '#7d1c14',
    accent: '#e2b04a',
    chip: '#24603f',
  },
  // The Specimen's lab: deep navy with a lighter band, yellow and green on ink (hot-potato README, "The look").
  potato: {
    ...BASE,
    ground: '#171b52',
    groundDot: '#1d2262',
    plate: '#1e2466',
    card: '#252c78',
    inkSoft: '#c3caf2',
    line: '#3f48a6',
    titlePlate: '#f5d03b',
    onTitlePlate: '#14163a',
    titleAccent: '#14163a',
    sticker: '#f5d03b',
    onSticker: '#14163a',
    step: '#2fd38f',
    onStep: '#0d1030',
    accent: '#f5d03b',
  },
  // Who Am I?'s own purple brand, from its dark theme (src/client/styles.css: brand #6d57e8, soft #2d2752).
  who: {
    ...BASE,
    ground: '#100d24',
    groundDot: '#171333',
    plate: '#1a1638',
    card: '#221d48',
    inkSoft: '#c4bfe8',
    line: '#3d3580',
    titlePlate: '#5b45d6',
    onTitlePlate: '#ffffff',
    titleAccent: '#ffe08a',
    sticker: '#ece8ff',
    onSticker: '#3a2790',
    step: '#ece8ff',
    onStep: '#3a2790',
    accent: '#a99bff',
  },
  // The poster's five inks on cream paper: tomato, mustard, teal, cream, navy (TIN-DERBY-DESIGN.md, "The look").
  derby: {
    ...BASE,
    ground: '#0e1532',
    groundDot: '#141d42',
    titlePlate: '#f3e3c3',
    onTitlePlate: '#232a45',
    titleAccent: '#b8301f',
    sticker: '#e8b13a',
    onSticker: '#232a45',
    step: '#f3e3c3',
    onStep: '#9e2a1b',
    accent: '#3aa9a0',
  },
  // The masquerade: plum and burgundy curtains, gold (the approved Paper Masks screens).
  masks: {
    ...BASE,
    ground: '#160a1c',
    groundDot: '#1e0f26',
    plate: '#22102b',
    card: '#2c1436',
    inkSoft: '#d9c4d6',
    line: '#5a2a52',
    titlePlate: '#5c1430',
    onTitlePlate: '#f6deb0',
    titleAccent: '#f1c96a',
    sticker: '#e9c46a',
    onSticker: '#2a0d1c',
    step: '#e9c46a',
    onStep: '#2a0d1c',
    accent: '#e9c46a',
  },
}

/** Every text pair a palette draws, [what, text, ground], for the contrast test. */
export function textPairs(p: Palette): [string, string, string][] {
  return [
    ['ink on ground', p.ink, p.ground],
    ['soft ink on ground', p.inkSoft, p.ground],
    ['ink on plate', p.ink, p.plate],
    ['soft ink on plate', p.inkSoft, p.plate],
    ['ink on card', p.ink, p.card],
    ['soft ink on card', p.inkSoft, p.card],
    ['title on its plate', p.onTitlePlate, p.titlePlate],
    ['title accent on its plate', p.titleAccent, p.titlePlate],
    ['sticker', p.onSticker, p.sticker],
    ['step number', p.onStep, p.step],
    ['accent on card', p.accent, p.card],
    ['Play', p.onPlay, p.play],
    ['chip', p.onChip, p.chip],
    ['focus on ground', p.focus, p.ground],
  ]
}

/** The palette as CSS custom properties, for a page's root element. */
export function paletteVars(p: Palette): Record<string, string> {
  return {
    '--g-ground': p.ground,
    '--g-ground-dot': p.groundDot,
    '--g-plate': p.plate,
    '--g-card': p.card,
    '--g-ink': p.ink,
    '--g-ink-soft': p.inkSoft,
    '--g-line': p.line,
    '--g-title-plate': p.titlePlate,
    '--g-on-title-plate': p.onTitlePlate,
    '--g-title-accent': p.titleAccent,
    '--g-sticker': p.sticker,
    '--g-on-sticker': p.onSticker,
    '--g-step': p.step,
    '--g-on-step': p.onStep,
    '--g-accent': p.accent,
    '--g-play': p.play,
    '--g-on-play': p.onPlay,
    '--g-chip': p.chip,
    '--g-on-chip': p.onChip,
    '--g-focus': p.focus,
  }
}
