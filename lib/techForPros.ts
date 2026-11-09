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
 * There is no booking page yet, so its button doesn't show; set it and the
 * button appears. The ad always links techforpros.com (its heading and "Visit
 * techforpros.com", owner, round 3 of 2026-11-08), through the counted short link.
 * The quote request itself sits on the ad (components/sections/QuoteForm.tsx,
 * owner, 2026-11-08): one email address, sent to the owner through this
 * site's contact backend until techforpros.com has a form of its own. The
 * contact form's quote preset (lib/contactPresets.ts) still answers old
 * /?inquiry=techforpros-quote links, and /#quote lands on the field.
 */
export const TECH_FOR_PROS_LINKS: {
  /** "Book an intro call": a booking page, once there is one. */
  booking?: string
} = {}
