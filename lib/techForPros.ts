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
 * "Request a quote" goes to this site's contact form with a quote preset
 * (lib/contactPresets.ts) until techforpros.com has a form of its own.
 */
export const TECH_FOR_PROS_LINKS: {
  /** "Request a quote": this site's contact form, preset for a Tech for Pros quote. */
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
  quote: '/?inquiry=techforpros-quote#contact',
}
