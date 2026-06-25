// The Loadout — "who I am" without a resume. You ARE your loadout.
// Each item: what it is + what I use it for + my one-line take.
// Content is curated/representative — edit freely as the kit changes.

export interface LoadoutItem {
  name: string
  /** what I use it for */
  whatFor: string
  /** my one-line take / opinion */
  take: string
  /** optional badge, e.g. "daily driver", "secret weapon", "local-first" */
  tag?: string
}

export interface LoadoutGroup {
  id: string
  title: string
  subtitle: string
  /** tailwind accent token for the group, e.g. 'cyan' | 'blue' | 'sky' | 'teal' */
  accent: 'cyan' | 'blue' | 'sky' | 'teal' | 'indigo'
  /** monospace section tag, e.g. "~/loadout/ai" */
  path: string
  items: LoadoutItem[]
}

// First-person intro, no resume energy. Shown as a terminal block (homepage hero + /loadout).
export const whoami: string[] = [
  '$ whoami',
  'Nathan — an AI-first software developer in LA, shipping in public.',
  'all in on AI and agentic coding, building everything I can.',
  'follow the journey, watch the process, ship with me.',
]

export const loadout: LoadoutGroup[] = [
  {
    id: 'ai',
    title: 'AI & Agents',
    subtitle: 'The part of the kit that does the heavy lifting now.',
    accent: 'cyan',
    path: '~/loadout/ai',
    items: [
      {
        name: 'Claude Code',
        whatFor: 'My main pair-programmer. I build basically everything here now — features, refactors, whole projects.',
        take: 'Closest thing to having a senior dev who never gets tired. Agent-native is the whole workflow.',
        tag: 'daily driver',
      },
      {
        name: 'Cursor',
        whatFor: 'Inline edits and quick context-aware changes when I want my hands on the keys.',
        take: 'Great for surgical edits; I reach for Claude Code when the task is bigger than a file.',
      },
      {
        name: 'OpenAI API',
        whatFor: 'Generation pipelines — icon extraction in Asset Arsenal, structured outputs, embeddings.',
        take: 'Still my default when I need reliable structured JSON out of a model.',
      },
      {
        name: 'Gemini API',
        whatFor: 'Summarization + analysis in my extensions (TL;DW, TL;DR Comments).',
        take: 'Long-context + cheap makes it perfect for "summarize this whole video" jobs.',
      },
      {
        name: 'Ollama + whisper.cpp + Piper',
        whatFor: 'Local inference — offline transcription (Scribe), local TTS, private experiments.',
        take: 'Local-first is underrated. No API bill, no data leaving the machine.',
        tag: 'local-first',
      },
    ],
  },
  {
    id: 'build',
    title: 'Build Stack',
    subtitle: 'What I actually write the apps in.',
    accent: 'blue',
    path: '~/loadout/build',
    items: [
      {
        name: 'Next.js',
        whatFor: 'Every web app I make. App Router by default.',
        take: 'The default for a reason. Server components + Vercel is a cheat code for shipping fast.',
        tag: 'daily driver',
      },
      {
        name: 'TypeScript',
        whatFor: 'Non-negotiable across everything — web, extensions, CLIs.',
        take: 'If it compiles, half my bugs never happened. Strict mode or bust.',
      },
      {
        name: 'Tailwind + shadcn/ui',
        whatFor: 'Styling and component primitives for every front end.',
        take: 'Utility-first means I never leave the file. shadcn gives me good bones to override.',
      },
      {
        name: 'Tauri + Rust',
        whatFor: 'When it has to be a real native desktop app (Scribe / LocalDictate).',
        take: 'Tiny binaries, native speed, and I get to write a little Rust without committing my life to it.',
      },
      {
        name: 'WXT',
        whatFor: 'My Chrome extension framework — MV3, React, fast HMR (the whole extensions shelf).',
        take: 'Makes MV3 extensions feel like building a normal app instead of fighting the manifest.',
      },
    ],
  },
  {
    id: 'ship',
    title: 'Ship & Infra',
    subtitle: 'Where the builds live and how data sticks around.',
    accent: 'sky',
    path: '~/loadout/ship',
    items: [
      {
        name: 'Vercel',
        whatFor: 'Hosting + deploys for n8builds.dev and most of my apps. Push to main, it ships.',
        take: 'Zero-config deploys mean I spend my time building, not babysitting infra.',
        tag: 'daily driver',
      },
      {
        name: 'Turso + Drizzle',
        whatFor: 'SQLite at the edge with a type-safe ORM (cutelyask.me, Asset Arsenal).',
        take: 'SQLite that scales globally + Drizzle\'s typing is my current favorite DB combo.',
      },
      {
        name: 'Supabase / Firebase',
        whatFor: 'Auth + realtime + Postgres when I want batteries included (Solara, BF6 Field Intel).',
        take: 'Reach for these when I want to skip the backend and get to the product.',
      },
      {
        name: 'Clerk',
        whatFor: 'Drop-in auth when I don\'t want to think about sessions (cutelyask.me).',
        take: 'Auth is a solved problem now; I refuse to roll my own again.',
      },
      {
        name: 'Cloudflare',
        whatFor: 'DNS, R2 object storage, email routing for my domains.',
        take: 'The quiet workhorse behind everything. R2 with no egress fees is the move.',
      },
    ],
  },
  {
    id: 'stream',
    title: 'Stream Kit',
    subtitle: 'How the "in public" part actually happens.',
    accent: 'teal',
    path: '~/loadout/stream',
    items: [
      {
        name: 'OBS Studio',
        whatFor: 'Capturing and streaming the builds. Scenes for code, cam, and overlays.',
        take: 'Free, infinitely tweakable, runs everything. The backbone of streaming.',
      },
      {
        name: 'VibeLoge',
        whatFor: 'My own build-telemetry overlay — git activity, Claude tokens, session stats live on stream.',
        take: 'I built the thing I wanted: a HUD that turns a coding session into a watchable story.',
        tag: 'built it myself',
      },
      {
        name: 'Scribe (LocalDictate)',
        whatFor: 'Hold a hotkey, talk, it types — local Whisper transcription at the cursor.',
        take: 'Also mine. Faster than typing for notes, prompts, and commit messages.',
        tag: 'built it myself',
      },
    ],
  },
  {
    id: 'rig',
    title: 'The Rig',
    subtitle: 'The battlestation. A build is just a loadout you can touch.',
    accent: 'indigo',
    path: '~/loadout/rig',
    items: [
      {
        name: 'AMD Ryzen 7 9700X',
        whatFor: '8 Zen 5 cores / 16 threads for compiling, local models, and three dev servers at once.',
        take: 'Zen 5 runs cool and fast — efficient enough that the fans stay quiet under a full build.',
      },
      {
        name: 'Radeon RX 7800 XT (16GB)',
        whatFor: 'Local inference, encoding the stream without dropping frames, and the occasional game.',
        take: '16GB of VRAM is the sweet spot — room for decent local models and still stream clean.',
      },
      {
        name: '32GB DDR5-6000 (CL32)',
        whatFor: 'Chrome, Docker, a local LLM, and OBS all wanting to be friends at the same time.',
        take: 'G.Skill DDR5 — RAM is cheap, closing tabs is expensive. Easy call.',
      },
      {
        name: 'Samsung 990 PRO 2TB',
        whatFor: 'OS, every project, and a graveyard of node_modules folders. Gen4 NVMe.',
        take: 'Fast storage you forget exists, which is exactly the point.',
      },
      {
        name: 'Gigabyte B650 Gaming X AX V2',
        whatFor: 'The board it all bolts to — AM5, PCIe Gen4, Wi-Fi 6E for when ethernet isn\'t handy.',
        take: 'B650 is the value-sane AM5 pick: everything I need, nothing I\'m paying to never use.',
      },
    ],
  },
  {
    id: 'desk',
    title: 'The Desk',
    subtitle: 'The stuff my hands actually touch.',
    accent: 'cyan',
    path: '~/loadout/desk',
    items: [
      {
        name: 'Acer XV272U V3 — 27" 1440p 180Hz',
        whatFor: 'The main code and stream surface. High-refresh 1440p IPS, with a second screen off to the side for reference.',
        take: 'A fast, sharp panel is the one screen upgrade I feel every single day — 180Hz spoils you.',
      },
      {
        name: 'Leopold mechanical',
        whatFor: 'All day every day — code, prompts, commit messages.',
        take: 'Thick PBT caps and a rock-solid case. The one piece of gear I\'m genuinely picky about.',
        tag: 'daily driver',
      },
      {
        name: 'Razer Cobra',
        whatFor: 'Pointer duty — light enough that long sessions don\'t wear on the wrist.',
        take: 'Light, simple, accurate. I don\'t want my mouse to have opinions.',
      },
      {
        name: 'Fifine USB mic',
        whatFor: 'Stream and recording audio that doesn\'t make people leave.',
        take: 'Good audio is the cheapest upgrade to sounding like you know what you\'re doing — no interface needed.',
      },
    ],
  },
]
