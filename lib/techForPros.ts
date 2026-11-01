/**
 * Tech for Pros, the owner's SaaS for service businesses (it took over from
 * Appturnity, the owner's consulting firm, in 2026). Its buttons (the navbar's
 * and the work-with-me card's) link to it already, through the counted
 * n8builds.dev/techforpros short link, as Appturnity's did (owner, 2026-11-01).
 * Until techforpros.com is live (`live`), nothing else links there: the
 * footer, the structured data and the copy that says "soon".
 * Going live is flipping `live` here, and in dev-portfolio's copy.
 */
export const TECH_FOR_PROS = {
  name: 'Tech for Pros',
  url: 'https://techforpros.com',
  live: false as boolean,
}

/** The plain link to Tech for Pros, or undefined while the site isn't live. */
export const techForProsHref: string | undefined = TECH_FOR_PROS.live ? TECH_FOR_PROS.url : undefined
