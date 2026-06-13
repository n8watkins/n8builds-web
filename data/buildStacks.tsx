// "Stacks I build with" — named combos, not a flat tool list. Each stack is a
// recipe of tools that go together for a kind of project. Edit freely.

export interface BuildStack {
  name: string
  tagline: string
  tools: string[]
  note: string
  accent: 'cyan' | 'blue' | 'sky' | 'teal'
}

export const buildStacks: BuildStack[] = [
  {
    name: 'The Turso Stack',
    tagline: 'My default for new web apps',
    tools: ['Next.js', 'TypeScript', 'Turso', 'Drizzle', 'Cloudflare R2', 'Vercel'],
    note: 'SQLite at the edge, fully type-safe, cheap to run. What I reach for first.',
    accent: 'cyan',
  },
  {
    name: 'The Firebase Stack',
    tagline: 'When I want batteries included',
    tools: ['Next.js', 'Firebase Auth', 'Firestore', 'Vercel'],
    note: 'Auth + realtime without the setup. I prefer Firebase here — I avoid Supabase.',
    accent: 'blue',
  },
  {
    name: 'The Local-First Stack',
    tagline: 'Native desktop apps',
    tools: ['Tauri', 'Rust', 'SQLite', 'whisper.cpp'],
    note: 'Tiny binaries, native speed, nothing leaves the machine (this is how Scribe is built).',
    accent: 'teal',
  },
  {
    name: 'The Extension Stack',
    tagline: 'Chrome extensions',
    tools: ['WXT', 'React', 'TypeScript', 'esbuild'],
    note: 'MV3 that feels like building a normal app instead of fighting the manifest.',
    accent: 'sky',
  },
]
