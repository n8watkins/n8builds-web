// "Currently Building" - the live in-public hook on the homepage, now a carousel
// of what's actively in progress. Keep this fresh; reorder so the top one is the
// thing you're most actively on. Edit anytime.

export interface NowUpdate {
  date: string // e.g. "Jun 11"
  text: string
}

export interface NowState {
  project: string
  tagline: string
  status: 'prototype' | 'active' | 'polishing' | 'shipping'
  /** one sentence: what I'm doing right now */
  focus: string
  /** the target I'm building toward */
  goal: string
  stack: string[]
  links?: { github?: string; live?: string }
  /** Its page on this site (/builds/<slug>), from data/builds.tsx. */
  buildSlug?: string
  /** recent build-log lines, newest first */
  updates: NowUpdate[]
}

export const nowItems: NowState[] = [
  {
    project: 'Appturnity',
    tagline: 'Software consulting & app studio',
    status: 'active',
    // DRAFT copy - replace focus/goal/updates with real build-log lines.
    focus: 'Tightening the lead-to-scope flow so a rough idea turns into a clear build plan fast.',
    goal: 'A consulting front door that scopes, prices, and kicks off real software for clients.',
    stack: ['React', 'TypeScript', 'Tailwind', 'Express'],
    // Appturnity's own site is its home; its GitHub repo is never linked.
    links: { live: 'https://appturnity.com' },
    updates: [
      { date: 'Jun 18', text: 'Live at appturnity.com - scoping new client builds.' },
      { date: 'Jun 12', text: 'Refined the on-site services and pricing breakdown.' },
    ],
  },
]
