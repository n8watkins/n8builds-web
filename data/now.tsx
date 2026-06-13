// "Currently Building" — the live in-public hook on the homepage.
// Keep this fresh: it's the thing that makes the site feel alive. Edit anytime.

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
  /** recent build-log lines, newest first */
  updates: NowUpdate[]
}

export const now: NowState = {
  project: 'Asset Arsenal',
  tagline: 'AI icon extraction workbench',
  status: 'prototype',
  focus: 'Wiring the icon-extraction pipeline up to a real download-the-pack flow.',
  goal: 'Drop in one design image, get back a full set of matching, production-ready icons.',
  stack: ['Next.js', 'OpenAI', 'Turso', 'Cloudflare R2', 'Stripe'],
  links: {
    github: 'https://github.com/n8watkins',
  },
  updates: [
    { date: 'Jun 12', text: 'Improved icon-style detection so generated icons match the source set.' },
    { date: 'Jun 10', text: 'Stubbed the Stripe checkout + R2 storage for downloadable packs.' },
    { date: 'Jun 08', text: 'Split the 6-step generation pipeline into a clean workbench UI.' },
  ],
}
