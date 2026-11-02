// "What I'm working on" - the homepage's first section after the hero, and the
// ad for Tech for Pros, the owner's SaaS for service businesses. Keep it
// current: what is shipping right now.

import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuBellRing, LuInbox, LuLayoutTemplate, LuStar } from 'react-icons/lu'
import type { TemplateSlide } from '@/components/sections/TemplateCarousel'
import TechForProsMark from '@/components/ui/TechForProsMark'
import { refHref } from '@/lib/referrals'
import { TECH_FOR_PROS, TECH_FOR_PROS_LINKS } from '@/lib/techForPros'

export interface NowUpdate {
  date: string // e.g. "Oct 25"
  text: string
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
  /** What the service does, as a compact set of short features with icons. */
  features: { icon: IconType; text: string }[]
  /** Real template screenshots, shown one after another in a browser frame (TemplateCarousel). */
  templates?: TemplateSlide[]
  /** one sentence: what I'm doing right now (in the What's new dialog) */
  focus: string
  /** the target I'm building toward (in the What's new dialog) */
  goal: string
  stack: string[]
  /**
   * The ad's buttons; the first is the primary one. A link into this site
   * (the contact form's quote preset) stays in the tab; any other opens a new one.
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
    // Owner, 2026-11-02: "Websites built for pros"; the copy is about the
    // service, never a list of trades (the templates show those).
    headline: { lead: 'Websites', accent: 'built for pros.' },
    pitch:
      'A few details about your business become a launch\u2011ready website. Then Tech for Pros takes the follow-up off your plate.',
    // Short enough for one line on a 320px phone (tests/e2e/now.spec.ts). What
    // the service does today, and what is next (from What's new's "Right now").
    features: [
      { icon: LuLayoutTemplate, text: 'A pro site, fast' },
      { icon: LuInbox, text: 'Every lead captured' },
      { icon: LuStar, text: 'Review requests' },
      { icon: LuBellRing, text: 'Reminders, next up' },
    ],
    // Tech for Pros' trade templates (from its hub's example shots), one
    // after another. Only templates that exist: pool, HVAC, landscaping, roofing.
    templates: [
      { src: '/now/template-pool.webp', width: 1200, height: 750, name: 'Pool', label: 'Pool service template', kind: 'pool' },
      { src: '/now/template-hvac.webp', width: 1200, height: 750, name: 'HVAC', label: 'HVAC template', kind: 'hvac' },
      { src: '/now/template-landscaping.webp', width: 1200, height: 750, name: 'Landscaping', label: 'Landscaping template', kind: 'landscaping' },
      { src: '/now/template-roofing.webp', width: 1200, height: 750, name: 'Roofing', label: 'Roofing template', kind: 'roofing' },
    ],
    focus:
      'Automated follow-up for leads and quotes, appointment and maintenance reminders, referrals and missed-call text-back.',
    goal:
      'One place for a service business: a launch-ready website from a few details, then the follow-up that brings customers in and keeps them.',
    stack: ['Next.js', 'Cloudflare'],
    // Request a quote, then a booking page and the site once they exist
    // (TECH_FOR_PROS_LINKS). The site goes through the counted short link,
    // under "hero": this card is the first screen's sneak peek.
    ctas: [
      { label: 'Request a quote', href: TECH_FOR_PROS_LINKS.quote },
      ...(TECH_FOR_PROS_LINKS.booking ? [{ label: 'Book an intro call', href: TECH_FOR_PROS_LINKS.booking }] : []),
      ...(TECH_FOR_PROS_LINKS.siteLive ? [{ label: `Visit ${TECH_FOR_PROS.domain}`, href: refHref('techforpros', 'hero') }] : []),
    ],
    updates: [],
  },
]
