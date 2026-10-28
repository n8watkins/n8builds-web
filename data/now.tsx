// "What I'm working on" - the homepage's first section after the hero, and the
// ad for Appturnity, the company the owner runs. Keep it current: what is
// shipping right now, from Appturnity's own repo (Appturnity/appturnity).

import { refHref } from '@/lib/referrals'

export interface NowUpdate {
  date: string // e.g. "Oct 25"
  text: string
}

/** A screenshot shown in a device frame on the ad. */
export interface NowShot {
  src: string
  width: number
  height: number
  /** What the frame's label says it is, e.g. "Pool service template". */
  label: string
  /**
   * The height the frame shows, in the image's pixels, for a full-page
   * screenshot taller than the frame: it scrolls slowly inside it.
   */
  frameHeight?: number
}

export interface NowState {
  project: string
  /** The project's own mark, shown next to its name. */
  logo?: string
  /** The project's own wordmark, light on dark, shown in place of the logo and name. */
  wordmark?: { src: string; width: number; height: number }
  /** One line on what the project is; the What's new dialog's subtitle. */
  tagline: string
  status: 'prototype' | 'active' | 'polishing' | 'shipping'
  /** What the badge says, when the offer itself says more than the status does. */
  badge?: string
  /** The ad's headline; `accent` is the highlighted end of it. */
  headline: { lead: string; accent: string }
  /** The ad's pitch, one short paragraph. */
  pitch: string
  /** Three short selling points, shown with checkmarks. */
  perks: string[]
  /** Real screenshots for the ad's device frames: a desktop page and a phone page. */
  showcase?: { desktop: NowShot; phone: NowShot }
  /** one sentence: what I'm doing right now (in the What's new dialog) */
  focus: string
  /** the target I'm building toward (in the What's new dialog) */
  goal: string
  stack: string[]
  /** The ad's buttons; the first is the primary one. All open the project's own site. */
  ctas?: { label: string; href: string }[]
  /** Its page on this site (/builds/<slug>), from data/builds.tsx. */
  buildSlug?: string
  /** recent build-log lines, newest first (in the What's new dialog) */
  updates: NowUpdate[]
}

export const nowItems: NowState[] = [
  {
    project: 'Appturnity',
    logo: '/brands/appturnity.png',
    // Appturnity's real wordmark (appturnity.com), its navy letters lightened for the dark card.
    wordmark: { src: '/brands/appturnity-wordmark-light.png', width: 623, height: 130 },
    tagline: 'Free websites and automation for service businesses',
    status: 'active',
    badge: 'Free websites',
    headline: { lead: 'Your free website,', accent: 'built for your trade.' },
    pitch:
      'Websites for service businesses, like pool, HVAC and landscaping companies. Pick a template made for your trade, and we build and launch it for free.',
    perks: ['Built and launched for free', 'Templates for your trade', 'Review requests add-on'],
    // Appturnity's own template previews (its home page and /examples use
    // them), copied from apps/hub/public/example-shots in its repo. The phone
    // is the full-length HVAC page (hvac-prism-mobile.webp, resized to 280px
    // wide), scrolling in its frame the way Appturnity's own site shows it.
    // A new filename, not the old crop's: image caches (next/image's, the
    // CDN's, browsers') key on the URL, and kept serving the short crop,
    // squashing the page into the frame.
    showcase: {
      desktop: { src: '/now/pool-clearline-template.webp', width: 1200, height: 750, label: 'Pool template' },
      phone: { src: '/now/hvac-phone-full.webp', width: 280, height: 7685, frameHeight: 700, label: 'HVAC template' },
    },
    focus:
      'Appturnity Booking: online booking with arrival windows and job-specific questions, so a pool, HVAC or landscaping customer can book without a phone call.',
    goal:
      'One account for a service business: a website we build and launch for free, then the systems that bring in work, like Google review requests and booking, on one bill.',
    stack: ['Next.js 16', 'Cloudflare Workers', 'D1', 'Stripe', 'Gemini'],
    // Appturnity's own site is its home; its GitHub repo is never linked.
    ctas: [
      { label: 'Claim your free website', href: refHref('appturnity', 'lab', 'free-website') },
      { label: 'See example sites', href: refHref('appturnity', 'lab', 'examples') },
    ],
    updates: [
      { date: 'Oct 25', text: 'Google review requests are now included in the Care and Pro plans.' },
      { date: 'Oct 25', text: 'Booking data layer landed: tenant-scoped bookings for Appturnity Booking.' },
      { date: 'Oct 25', text: '"I want this" on planned features, with an email the day they launch.' },
    ],
  },
]
