// "What I'm working on" - the homepage's first section after the hero, and the
// ad for Appturnity, the company the owner runs. Keep it current: what is
// shipping right now, from Appturnity's own repo (Appturnity/appturnity).

export interface NowUpdate {
  date: string // e.g. "Oct 25"
  text: string
}

export interface NowState {
  project: string
  /** The project's own mark, shown next to its name. */
  logo?: string
  tagline: string
  status: 'prototype' | 'active' | 'polishing' | 'shipping'
  /** one sentence: what I'm doing right now */
  focus: string
  /** the target I'm building toward */
  goal: string
  stack: string[]
  /** The ad's buttons; the first is the primary one. All open the project's own site. */
  ctas?: { label: string; href: string }[]
  /** Its page on this site (/builds/<slug>), from data/builds.tsx. */
  buildSlug?: string
  /** recent build-log lines, newest first */
  updates: NowUpdate[]
}

export const nowItems: NowState[] = [
  {
    project: 'Appturnity',
    logo: '/brands/appturnity.png',
    tagline: 'Free websites and automation for local service businesses',
    status: 'active',
    focus:
      'Appturnity Booking: online booking with arrival windows and job-specific questions, so a pool, HVAC or landscaping customer can book without a phone call.',
    goal:
      'One account for a local service business: a website we build and launch for free, then the systems that bring in work, like Google review requests and booking, on one bill.',
    stack: ['Next.js 16', 'Cloudflare Workers', 'D1', 'Stripe', 'Gemini'],
    // Appturnity's own site is its home; its GitHub repo is never linked.
    ctas: [
      { label: 'Claim your free website', href: 'https://appturnity.com/#free-website' },
      { label: 'See example sites', href: 'https://appturnity.com/examples' },
    ],
    updates: [
      { date: 'Oct 25', text: 'Google review requests are now included in the Care and Pro plans.' },
      { date: 'Oct 25', text: 'Booking data layer landed: tenant-scoped bookings for Appturnity Booking.' },
      { date: 'Oct 25', text: '"I want this" on planned features, with an email the day they launch.' },
    ],
  },
]
