// "Currently Building" — the live in-public hook on the homepage, now a carousel
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
  /** recent build-log lines, newest first */
  updates: NowUpdate[]
}

export const nowItems: NowState[] = [
  {
    project: 'Appturnity',
    tagline: 'Software consulting & app studio',
    status: 'active',
    // DRAFT copy — replace focus/goal/updates with real build-log lines.
    focus: 'Tightening the lead-to-scope flow so a rough idea turns into a clear build plan fast.',
    goal: 'A consulting front door that scopes, prices, and kicks off real software for clients.',
    stack: ['React', 'TypeScript', 'Tailwind', 'Express'],
    links: { github: 'https://github.com/n8watkins/appturnity', live: 'https://appturnity.com' },
    updates: [
      { date: 'Jun 18', text: 'Live at appturnity.com — scoping new client builds.' },
      { date: 'Jun 12', text: 'Refined the on-site services and pricing breakdown.' },
    ],
  },
  {
    project: 'Asset Arsenal',
    tagline: 'AI icon extraction workbench',
    status: 'prototype',
    focus: 'Wiring the icon-extraction pipeline up to a real download-the-pack flow.',
    goal: 'Drop in one design image, get back a full set of matching, production-ready icons.',
    stack: ['Next.js', 'OpenAI', 'Turso', 'Cloudflare R2', 'Stripe'],
    links: { github: 'https://github.com/n8watkins' },
    updates: [
      { date: 'Jun 12', text: 'Improved icon-style detection so generated icons match the source set.' },
      { date: 'Jun 10', text: 'Stubbed the Stripe checkout + R2 storage for downloadable packs.' },
      { date: 'Jun 08', text: 'Split the 6-step generation pipeline into a clean workbench UI.' },
    ],
  },
  {
    project: 'VibeLoge',
    tagline: 'Live coding telemetry & OBS overlay',
    status: 'active',
    focus: 'Tightening the live HUD and the auto end-of-stream recap.',
    goal: 'Turn any coding session into a watchable story — live stats now, recap after.',
    stack: ['Node.js', 'TypeScript', 'OBS'],
    links: { github: 'https://github.com/n8watkins' },
    updates: [
      { date: 'Jun 11', text: 'Markers ("vibe mark feature/bug") now annotate the session live.' },
      { date: 'Jun 09', text: 'Overlay served as an OBS browser source at localhost:4545/overlay.' },
      { date: 'Jun 07', text: 'Demo mode seeds fake data so the overlay previews with no repo.' },
    ],
  },
]
