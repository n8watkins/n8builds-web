// "What I'm working on" - the homepage's first section after the hero, and the
// ad for Tech for Pros, the owner's SaaS for service businesses. Keep it
// current: what is shipping right now.

import type { ReactNode } from 'react'
import TechForProsMark from '@/components/ui/TechForProsMark'
import { refHref } from '@/lib/referrals'
import { TECH_FOR_PROS } from '@/lib/techForPros'

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
  /** Its name: the carousel's label and the What's new dialog's title. */
  project: string
  /** The card's heading, when it isn't the name (a site's address, say). */
  title?: string
  /** The project's own mark, beside its heading and the dialog's; it fills the box it's given. */
  mark?: ReactNode
  /** The project's own wordmark, light on dark, shown in place of the mark and name. */
  wordmark?: { src: string; width: number; height: number }
  /** One line on what the project is; the What's new dialog's subtitle. */
  tagline: string
  status: 'prototype' | 'active' | 'polishing' | 'shipping'
  /** A badge beside the heading, in the status's colour; none without it. */
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
  /**
   * The ad's buttons; the first is the primary one. All open the project's
   * own site, and so does the picture (the second button's page, if any).
   */
  ctas?: { label: string; href: string }[]
  /** Its page on this site (/builds/<slug>), from data/builds.tsx. */
  buildSlug?: string
  /** recent build-log lines, newest first (in the What's new dialog) */
  updates: NowUpdate[]
}

export const nowItems: NowState[] = [
  {
    project: TECH_FOR_PROS.name,
    // Its address as the heading, beside its icon (owner, 2026-11-01).
    title: TECH_FOR_PROS.domain,
    mark: <TechForProsMark className="h-full w-full" sizes="44px" />,
    tagline: 'Websites and follow-up for service businesses',
    status: 'active',
    headline: { lead: 'Your website,', accent: 'built for your trade.' },
    pitch:
      'Tech for Pros turns a few details about a pool, HVAC or landscaping business into a launch-ready website, then takes the follow-up off their plate.',
    // Short enough for one line on a 320px phone (tests/e2e/now.spec.ts).
    perks: ['Templates for your trade', 'Lead capture and reviews', 'Reminders, coming next'],
    // Template previews from the Appturnity days, until Tech for Pros has its
    // own. The phone is the full-length HVAC page (resized to 280px wide),
    // scrolling in its frame. A new filename, not the old crop's: image
    // caches (next/image's, the CDN's, browsers') key on the URL, and kept
    // serving the short crop, squashing the page into the frame.
    showcase: {
      desktop: { src: '/now/pool-clearline-template.webp', width: 1200, height: 750, label: 'Pool template' },
      phone: { src: '/now/hvac-phone-full.webp', width: 280, height: 7685, frameHeight: 700, label: 'HVAC template' },
    },
    focus:
      'Automated follow-up for leads and quotes, appointment and maintenance reminders, referrals and missed-call text-back.',
    goal:
      'One place for a service business: a launch-ready website from a few details, then the follow-up that brings customers in and keeps them.',
    stack: ['Next.js', 'Cloudflare'],
    // Counted under "hero": this card is the first screen's sneak peek.
    ctas: [{ label: `Visit ${TECH_FOR_PROS.domain}`, href: refHref('techforpros', 'hero') }],
    updates: [],
  },
]
