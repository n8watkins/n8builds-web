import localFont from 'next/font/local'

/*
 * The n8games pages' typefaces, served from this site (all SIL Open Font
 * License, from Fontsource 5.3.0; the licences sit beside the files in
 * fonts/, next to this file). Baloo 2 and Nunito are the family's own (the approved
 * preview); each game page adds one heading face of its own game's.
 * Only the family's two are preloaded: a game's face loads on its page alone.
 */

export const baloo = localFont({
  src: './fonts/baloo-2-latin-wght-normal.woff2',
  weight: '400 800',
  variable: '--font-n8g-display',
  display: 'swap',
  fallback: ['Arial Rounded MT Bold', 'Trebuchet MS', 'system-ui', 'sans-serif'],
})

export const nunito = localFont({
  src: './fonts/nunito-latin-wght-normal.woff2',
  weight: '200 1000',
  variable: '--font-n8g-text',
  display: 'swap',
  fallback: ['Segoe UI', 'system-ui', 'sans-serif'],
})

/** Cork & Bell: the sign-writer's fat face. */
export const abril = localFont({
  src: './fonts/abril-fatface-latin-400-normal.woff2',
  weight: '400',
  variable: '--font-n8g-cork',
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'serif'],
})

/** Hot Potato: the Specimen's condensed capitals. */
export const anton = localFont({
  src: './fonts/anton-latin-400-normal.woff2',
  weight: '400',
  variable: '--font-n8g-potato',
  display: 'swap',
  preload: false,
  fallback: ['Impact', 'Arial Narrow', 'sans-serif'],
})

/** Tin Derby: the poster's heavy display face. */
export const bowlby = localFont({
  src: './fonts/bowlby-one-latin-400-normal.woff2',
  weight: '400',
  variable: '--font-n8g-derby',
  display: 'swap',
  preload: false,
  fallback: ['Arial Black', 'sans-serif'],
})

/** Paper Masks: the playbill's capitals. */
export const cinzel = localFont({
  src: './fonts/cinzel-decorative-latin-700-normal.woff2',
  weight: '700',
  variable: '--font-n8g-masks',
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'serif'],
})
