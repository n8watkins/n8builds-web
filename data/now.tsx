// "What I'm working on" - the homepage's first section after the hero, and the
// ad for Tech for Pros, the owner's SaaS for service businesses. Keep it
// current: what is shipping right now.

import type { ReactNode } from 'react'
import type { TemplateSlide } from '@/components/sections/TemplateCarousel'
import TechForProsMark from '@/components/ui/TechForProsMark'
import { refHref } from '@/lib/referrals'
import { TECH_FOR_PROS, TECH_FOR_PROS_LINKS } from '@/lib/techForPros'

/** A screenshot shown in a device frame on the ad. */
export interface NowShot {
  src: string
  width: number
  height: number
  /** What the frame's label says it is, e.g. "HVAC template". */
  label: string
  /**
   * The height the frame shows, in the image's pixels, for a full-page
   * screenshot taller than the frame: it scrolls slowly inside it.
   */
  frameHeight?: number
}

export interface NowState {
  /** Its name: the carousel's label. */
  project: string
  /** The card's heading, when it isn't the name (a site's address, say). */
  title?: string
  /** The project's own mark, beside its heading; it fills the box it's given. */
  mark?: ReactNode
  /** Where its heading (mark and title) links, in a new tab. */
  href?: string
  /** The ad's headline; `accent` is the highlighted end of it. */
  headline: { lead: string; accent: string }
  /** The ad's pitch, one short paragraph. */
  pitch: string
  /** Real template screenshots, one after another in the browser window (TemplateCarousel). */
  templates: TemplateSlide[]
  /** A full-length page on the phone in front of the browser window; it scrolls in its frame. */
  phone: NowShot
  /** Whether the ad asks for a quote in place (QuoteForm: an email field and "Get my quote"). */
  quote?: boolean
  /**
   * The ad's buttons, under the quote request; with no quote request the first
   * is the primary one. A link into this site (the contact form's quote
   * preset) stays in the tab; any other opens a new one.
   */
  ctas: { label: string; href: string }[]
}

export const nowItems: NowState[] = [
  {
    project: TECH_FOR_PROS.name,
    // Its address as the heading, beside its icon (owner, 2026-11-01).
    title: TECH_FOR_PROS.domain,
    // The heading and "Visit techforpros.com" both go to the site, through the counted
    // short link under "hero" (owner, round 3 of 2026-11-08).
    href: refHref('techforpros', 'hero'),
    mark: <TechForProsMark className="h-full w-full" sizes="44px" />,
    // Owner, 2026-11-02: "Websites built for pros"; the copy is about the
    // service, never a list of trades (the templates show those), and there
    // is no feature list (round 3).
    headline: { lead: 'Websites', accent: 'built for pros.' },
    pitch:
      'A few details about your business become a launch‑ready website. Then Tech for Pros takes the follow-up off your plate.',
    // Tech for Pros' trade templates (from its hub's example shots), one
    // after another. Only templates that exist: pool, HVAC, landscaping, roofing.
    templates: [
      { src: '/now/template-pool.webp', width: 1200, height: 750, name: 'Pool', label: 'Pool service template', kind: 'pool' },
      { src: '/now/template-hvac.webp', width: 1200, height: 750, name: 'HVAC', label: 'HVAC template', kind: 'hvac' },
      { src: '/now/template-landscaping.webp', width: 1200, height: 750, name: 'Landscaping', label: 'Landscaping template', kind: 'landscaping' },
      { src: '/now/template-roofing.webp', width: 1200, height: 750, name: 'Roofing', label: 'Roofing template', kind: 'roofing' },
    ],
    // The full-length HVAC page (resized to 280px wide), scrolling in its
    // frame. A new filename, not the old crop's: image caches key on the URL.
    phone: { src: '/now/hvac-phone-full.webp', width: 280, height: 7685, frameHeight: 700, label: 'HVAC template' },
    // The quote request right on the card (owner, 2026-11-08; it was a "Get a quote"
    // button down to a quote field lower on the page), then a booking page once
    // there is one. The site is linked from the heading (no "Visit" button since
    // round 4 of 2026-11-08).
    quote: true,
    ctas: [...(TECH_FOR_PROS_LINKS.booking ? [{ label: 'Book an intro call', href: TECH_FOR_PROS_LINKS.booking }] : [])],
  },
]
