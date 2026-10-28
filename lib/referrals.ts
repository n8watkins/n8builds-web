/**
 * Counted short links to the owner's other sites: n8builds.dev/appturnity and
 * n8builds.dev/portfolio (app/appturnity/route.ts, app/portfolio/route.ts).
 * Each click adds one to a per-day, per-placement count the admin dashboard
 * reads; nothing about the visitor is kept. Safe to import from client
 * components: the counting itself lives in lib/analyticsStore.ts.
 */

/** Where on n8builds.dev (or in which email) a link sits. Anything else counts as "other". */
export const REF_SOURCES = ['email', 'lab', 'navbar', 'footer', 'card', 'hero', 'other'] as const
export type RefSource = (typeof REF_SOURCES)[number]

export function refSource(value: string | null | undefined): RefSource {
  return (REF_SOURCES as readonly string[]).includes(value ?? '') ? (value as RefSource) : 'other'
}

/** The pages a link may land on, by name, so the short link can't redirect anywhere else. */
export const DESTINATIONS = {
  appturnity: {
    home: 'https://appturnity.com/',
    'free-website': 'https://appturnity.com/#free-website',
    pricing: 'https://appturnity.com/pricing',
    examples: 'https://appturnity.com/examples',
  },
  portfolio: {
    home: 'https://portfolio.n8builds.dev/',
  },
} as const

export type RefTarget = keyof typeof DESTINATIONS
export type RefPage<T extends RefTarget> = keyof (typeof DESTINATIONS)[T]

/** "/appturnity?from=navbar&to=pricing": a counted link to one of the pages above. */
export function refHref<T extends RefTarget>(target: T, from: RefSource, page?: RefPage<T>): string {
  const to = page && page !== 'home' ? `&to=${String(page)}` : ''
  return `/${target}?from=${from}${to}`
}

/**
 * The page a short link sends to, with UTM tags so the destination's own
 * analytics see where the visit came from. Unknown pages go to the home page.
 */
export function refDestination(target: RefTarget, from: RefSource, page: string | null): string {
  const pages = DESTINATIONS[target] as Record<string, string>
  const url = new URL(Object.hasOwn(pages, page ?? '') ? pages[page as string] : pages.home)
  url.searchParams.set('utm_source', 'n8builds.dev')
  url.searchParams.set('utm_medium', 'referral')
  url.searchParams.set('utm_content', from)
  return url.toString()
}

/**
 * Whether a link leaves n8builds.dev: absolute URLs and the counted short
 * links. Those render as plain new-tab anchors, never as Next.js <Link>,
 * whose prefetch would hit the short link and count a click nobody made.
 */
export function isOutbound(href: string): boolean {
  return /^https?:\/\//.test(href) || /^\/(appturnity|portfolio)(\?|$)/.test(href)
}
