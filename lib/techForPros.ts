/**
 * Tech for Pros, the owner's SaaS for service businesses (it took over from
 * Appturnity, his consulting firm, in 2026). techforpros.com isn't live yet:
 * while `live` is false nothing links to it, and its cards say "Coming soon"
 * instead (tests/e2e/tech-for-pros.spec.ts checks no link points there).
 * Going live is flipping `live` here, and in dev-portfolio's copy.
 */
export const TECH_FOR_PROS = {
  name: 'Tech for Pros',
  url: 'https://techforpros.com',
  live: false as boolean,
}

/** The link to Tech for Pros, or undefined while the site isn't live. */
export const techForProsHref: string | undefined = TECH_FOR_PROS.live ? TECH_FOR_PROS.url : undefined
