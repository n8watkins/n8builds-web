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
