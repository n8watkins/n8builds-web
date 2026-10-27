import type { ReactElement } from 'react'
import { BsOpenai } from 'react-icons/bs'
import { LuCircuitBoard, LuKeyboard, LuMemoryStick, LuMic } from 'react-icons/lu'
import { SiAcer, SiAmd, SiClaude, SiGooglegemini, SiObsstudio, SiRazer, SiSamsung } from 'react-icons/si'
import { GgmlMark } from '@/data/aiStack'

// The Loadout - "who I am" without a resume. You ARE your loadout.
// Each item: what it is + what I use it for + my one-line take.
// Content is curated/representative - edit freely as the kit changes.

export interface LoadoutItem {
  name: string
  /** what I use it for */
  whatFor: string
  /** my one-line take / opinion */
  take: string
  /** optional badge, e.g. "built it myself", "local-first" */
  tag?: string
  /** the brand's own mark where it has one, else a plain icon of the thing */
  icon?: ReactElement
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

// First-person intro, no resume energy. Shown as a terminal block in the homepage hero:
// the name sits in the window's title bar (~/whoami), the body is two short sentences that type out.
export const whoamiTitle = { path: '~/whoami', name: "Nathan 'N8' Watkins" }
export const whoami: string[] = ['AI-first software developer.', 'I build apps and tools I wish existed.', 'Shipping with Claude Opus 5.5.']

/**
 * How I work with AI, in the order a piece of work goes through it: decide
 * what to build, build it, then fix what's hard. Each step names the tool and
 * the model I reach for, and why. The Loadout page's headline section.
 */
export interface WorkflowStep {
  /** The step, as a verb: what I'm doing when I reach for it. */
  step: string
  tool: string
  /** The model behind it, when it matters. */
  model?: string
  icon: ReactElement
  /** The tool's brand colour, for its glow. */
  color: string
  whatFor: string
  take: string
}

export const workflow: WorkflowStep[] = [
  {
    step: 'Decide',
    tool: 'ChatGPT',
    icon: <BsOpenai className="h-full w-full" />,
    color: '#e5e7eb',
    whatFor:
      'General decision-making: weighing options, planning a build, a sounding board before any code exists. Voice mode when I want to talk an idea through out loud.',
    take: 'The thinking partner. It is where a rough idea becomes a plan.',
  },
  {
    step: 'Build',
    tool: 'Claude Code',
    model: 'Claude Opus 5.5',
    icon: <SiClaude className="h-full w-full" />,
    color: '#D97757',
    whatFor:
      'Execution and development, on the most advanced model there is: features, refactors, whole projects, tested and shipped through pull requests.',
    take: 'The one that does the work. Everything on this site was built here.',
  },
  {
    step: 'Fix',
    tool: 'Codex and Gemini',
    icon: (
      // The two marks overlapping, OpenAI's top left and Gemini's bottom right.
      <span className="relative block h-full w-full">
        <BsOpenai className="absolute top-0 left-0 h-[62%] w-[62%] text-[#e5e7eb]" />
        <SiGooglegemini className="absolute right-0 bottom-0 h-[62%] w-[62%] text-[#4285F4]" />
      </span>
    ),
    color: '#4285F4',
    whatFor:
      'Bug fixes and deeper thinking: the hard problems that need a second model and a careful pass before any change.',
    take: 'When a bug fights back, a fresh pair of eyes from another lab usually finds it.',
  },
]

/** The harnesses the models run in: the tools that let them work on the code. */
export const harnesses: { name: string; whatFor: string }[] = [
  { name: 'Claude Code', whatFor: 'my main harness, where the building happens' },
  { name: 'Pi', whatFor: 'a minimal coding-agent harness that runs any model' },
  { name: 'Codex', whatFor: 'OpenAI\'s coding agent, which comes with its own harness: my second opinion for fixes' },
]

/** The AI inside the apps I build (what my users' requests actually run on). */
export const inApps: { name: string; icon: ReactElement; color: string; whatFor: string; tag?: string }[] = [
  {
    name: 'Gemini API',
    icon: <SiGooglegemini className="h-full w-full" />,
    color: '#4285F4',
    whatFor: 'Long-context chat, research and analysis: GeminiGPT, Scout, Echo and Net-Trailer run on it.',
  },
  {
    name: 'OpenAI API',
    icon: <BsOpenai className="h-full w-full" />,
    color: '#e5e7eb',
    whatFor: 'Structured outputs and generation pipelines, when I need reliable JSON out of a model.',
  },
  {
    name: 'whisper.cpp',
    icon: <GgmlMark className="h-full w-full" />,
    color: '#e6edf6',
    whatFor: 'Local speech-to-text: Scribe runs OpenAI\'s Whisper models on your own PC with it, no cloud involved.',
    tag: 'local-first',
  },
]

export const loadout: LoadoutGroup[] = [
  {
    id: 'stream',
    title: 'Stream Kit',
    subtitle: 'How the "in public" part actually happens.',
    accent: 'teal',
    path: '~/loadout/stream',
    items: [
      {
        name: 'OBS Studio',
        icon: <SiObsstudio />,
        whatFor: 'Capturing and streaming the builds. Scenes for code, cam, and overlays.',
        take: 'Free, infinitely tweakable, runs everything. The backbone of streaming.',
      },
      {
        name: 'Scribe',
        whatFor: 'Hold a hotkey, talk, it types - local Whisper transcription at the cursor.',
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
        icon: <SiAmd />,
        whatFor: '8 Zen 5 cores / 16 threads for compiling, local models, and three dev servers at once.',
        take: 'Zen 5 runs cool and fast - efficient enough that the fans stay quiet under a full build.',
      },
      {
        name: 'Radeon RX 7800 XT (16GB)',
        icon: <SiAmd />,
        whatFor: 'Local inference, encoding the stream without dropping frames, and the occasional game.',
        take: '16GB of VRAM is the sweet spot - room for decent local models and still stream clean.',
      },
      {
        name: '32GB DDR5-6000 (CL32)',
        icon: <LuMemoryStick />,
        whatFor: 'Chrome, Docker, a local LLM, and OBS all wanting to be friends at the same time.',
        take: 'G.Skill DDR5 - RAM is cheap, closing tabs is expensive. Easy call.',
      },
      {
        name: 'Samsung 990 PRO 2TB',
        icon: <SiSamsung />,
        whatFor: 'OS, every project, and a graveyard of node_modules folders. Gen4 NVMe.',
        take: 'Fast storage you forget exists, which is exactly the point.',
      },
      {
        name: 'Gigabyte B650 Gaming X AX V2',
        icon: <LuCircuitBoard />,
        whatFor: 'The board it all bolts to - AM5, PCIe Gen4, Wi-Fi 6E for when ethernet isn\'t handy.',
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
        name: 'Acer XV272U V3 - 27" 1440p 180Hz',
        icon: <SiAcer />,
        whatFor: 'The main code and stream surface. High-refresh 1440p IPS, with a second screen off to the side for reference.',
        take: 'A fast, sharp panel is the one screen upgrade I feel every single day - 180Hz spoils you.',
      },
      {
        name: 'Leopold mechanical',
        icon: <LuKeyboard />,
        whatFor: 'All day every day - code, prompts, commit messages.',
        take: 'Thick PBT caps and a rock-solid case. The one piece of gear I\'m genuinely picky about.',
      },
      {
        name: 'Razer Cobra',
        icon: <SiRazer />,
        whatFor: 'Pointer duty - light enough that long sessions don\'t wear on the wrist.',
        take: 'Light, simple, accurate. I don\'t want my mouse to have opinions.',
      },
      {
        name: 'Fifine USB mic',
        icon: <LuMic />,
        whatFor: 'Stream and recording audio that doesn\'t make people leave.',
        take: 'Good audio is the cheapest upgrade to sounding like you know what you\'re doing - no interface needed.',
      },
    ],
  },
]
