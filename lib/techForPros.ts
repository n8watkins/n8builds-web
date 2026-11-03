/**
 * Tech for Pros, the owner's SaaS for service businesses (it took over from
 * Appturnity, the owner's consulting firm, in 2026). The site links to it
 * everywhere (owner, 2026-11-01): the on-site buttons go through the counted
 * n8builds.dev/techforpros short link (lib/referrals.ts), so the admin sees
 * the clicks; the footer and the structured data use the plain URL.
 */
export const TECH_FOR_PROS = {
  name: 'Tech for Pros',
  /** How the site writes its address, as a link's text. */
  domain: 'techforpros.com',
  url: 'https://techforpros.com',
  /** Its icon (a worker holding a gear), made by scripts/gen-techforpros-icon.mjs. */
  icon: '/brands/techforpros.png',
} as const

/**
 * Where the homepage's Tech for Pros ad sends people (owner, 2026-11-02).
 * techforpros.com has no site yet and there is no booking page yet, so those
 * two are unset and their buttons don't show; set one and its button appears.
 * "Get a quote" (round 5 of 2026-11-02; "Request a quote" before, into the
 * contact form) goes to the quote field on the Tech for Pros card in Work with
 * me (components/sections/QuoteForm.tsx): one email address, sent to the
 * owner through this site's contact backend until techforpros.com has a form
 * of its own. The contact form's quote preset (lib/contactPresets.ts) still
 * answers old /?inquiry=techforpros-quote links.
 */
export const TECH_FOR_PROS_LINKS: {
  /** "Get a quote": the Tech for Pros card's quote field, lower on the homepage. */
  quote: string
  /** "Book an intro call": a booking page, once there is one. */
  booking?: string
  /**
   * "Visit techforpros.com": set to true once the site is live. The button
   * goes through the counted short link (/techforpros?from=hero), never the
   * plain URL.
   */
  siteLive?: boolean
} = {
  quote: '/#quote',
}
