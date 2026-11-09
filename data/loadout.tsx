import type { ReactElement } from 'react'
import Image from 'next/image'
import type { IconType } from 'react-icons'
import { BsOpenai } from 'react-icons/bs'
import { FaWindows } from 'react-icons/fa6'
import {
  LuBot,
  LuChartColumn,
  LuCircuitBoard,
  LuCpu,
  LuGlobe,
  LuHammer,
  LuHardDrive,
  LuHeadphones,
  LuKeyRound,
  LuKeyboard,
  LuLayers,
  LuLayoutDashboard,
  LuMemoryStick,
  LuMic,
  LuNetwork,
  LuNewspaper,
  LuPanelBottom,
  LuRecycle,
  LuGauge,
  LuShieldCheck,
  LuShip,
  LuSquareTerminal,
  LuTag,
  LuTrees,
  LuWorkflow,
  LuWrench,
} from 'react-icons/lu'
import {
  SiAcer,
  SiAmd,
  SiBun,
  SiClaude,
  SiCloudflare,
  SiGithub,
  SiGoogle,
  SiGooglegemini,
  SiNeovim,
  SiNodedotjs,
  SiPnpm,
  SiPython,
  SiRazer,
  SiRust,
  SiSentry,
  SiSamsung,
  SiTmux,
  SiTurso,
  SiUbuntu,
  SiVercel,
  SiZsh,
} from 'react-icons/si'
import { VscVscode } from 'react-icons/vsc'
import { GgmlMark } from '@/data/stack'
import type { RailPart } from '@/components/ui/SectionRail'

// The Loadout - "who I am" without a resume. You ARE your loadout.
// Each item: what it is + what I use it for + my one-line take.
// Content is curated/representative - edit freely as the kit changes.

/**
 * One part of /loadout. `accent` is its colour, an RGB triplet: its heading's
 * icon, its pill's icon and its band's wash (`.loadout-part` in
 * app/globals.css) take it, so each part reads as its own as you scroll (the
 * owner's ask, 2026-11-02). Warm and cool take turns down the page; peak
 * tint stays low, as in the Lab's washes, so text keeps its contrast.
 */
export type LoadoutPart = RailPart & { accent: string }

/**
 * The page's parts, in page order: the pills under its header and the side
 * rail (components/sections/LoadoutSectionNav.tsx) both list these, and each
 * part's heading shows the same icon. `short` is the rail's on-screen label
 * where its gutter is too narrow for the full one (1440-1535px); the link's
 * accessible name stays whole.
 */
export const loadoutParts: readonly LoadoutPart[] = [
  { id: 'dev-setup', label: 'Dev setup', icon: LuSquareTerminal, accent: '34 211 238' },
  { id: 'workflow', label: 'How I work', icon: LuWorkflow, accent: '251 146 60' },
  { id: 'in-apps', label: 'Inside my apps', icon: LuBot, accent: '96 165 250' },
  { id: 'stacks', label: 'Stacks I build with', short: 'Stacks', icon: LuLayers, accent: '52 211 153' },
  { id: 'tools-i-built', label: 'Tools I built and use', short: 'My tools', icon: LuHammer, accent: '251 191 36' },
  { id: 'tools-i-use', label: 'Tools I use', icon: LuWrench, accent: '129 140 248' },
  { id: 'gear', label: 'The gear', icon: LuHeadphones, accent: '244 114 182' },
]

/** A part by its id (its heading and band look it up). */
export const loadoutPart = (id: string) => loadoutParts.find((part) => part.id === id)!

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
export const whoami: string[] = ['AI-first software developer.', 'I build apps and tools I wish existed.']

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
    whatFor: 'Long-context chat, research and analysis: Net-Trailer runs on it.',
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

/**
 * The marks of the tools I made, defined once and used wherever a tool
 * appears (owner, 2026-11-02: one icon per tool everywhere): My dev setup's
 * chips, the Tools I built and use cards on /loadout and in the homepage's
 * Loadout. None has a logo of its own, so each has a glyph no other item uses
 * (devguard was the processor chip, which "8 processors" in the WSL2 tile also
 * showed, so it is a gauge now).
 */
export const OWN_TOOL_ICONS = {
  devguard: LuGauge,
  'pass-env': LuKeyRound,
  'release-kit': LuTag,
  'pr-post': LuNewspaper,
  'n8-tray': LuPanelBottom,
  't-hub': LuLayoutDashboard,
} as const satisfies Record<string, IconType>

export type OwnTool = keyof typeof OWN_TOOL_ICONS

/** A tool's mark, as an element. */
export function ownToolIcon(tool: OwnTool): ReactElement {
  const Icon = OWN_TOOL_ICONS[tool]
  return <Icon />
}

/** A person or organisation, linked. */
export interface NamedLink {
  name: string
  href: string
}

/**
 * The things I built and use, the cards in "Tools I built and use" (on
 * /loadout and in the homepage's Loadout), in two groups since round 3 of
 * 2026-11-02: the dev tools, led by Scribe's row (Scribe is an app, a build
 * in data/builds.tsx; not strictly a dev tool, but I dictate to my agents
 * with it all day), and the other things I built. One entry per tool;
 * adding a tool is adding an entry here.
 */
export interface BuiltTool {
  /** The anchor id on /loadout. */
  id: string
  name: string
  /**
   * Which group it sits in: a dev tool I built, or another thing I built; or
   * `featured`, for one with its own card elsewhere and no place in the
   * groups (PR Post: The Pull Request Post's card under People I follow on
   * the homepage, round 5 of 2026-11-02: it showed twice).
   */
  group: 'dev' | 'other' | 'featured'
  /** One line: what it does for you. */
  pitch: string
  /** Two short sentences on how. */
  detail: string
  /** The public repo; it feeds the Star | GitHub button. */
  github: string
  /** A live demo, linked next to the repo button. */
  demo?: string
  /** For a fork: who made the original, and what my fork adds. */
  credit?: { author: NamedLink; org?: NamedLink; note: string }
  tags: string[]
  icon: ReactElement
}

export const toolsIBuilt: BuiltTool[] = [
  {
    id: 'pass-env',
    name: 'pass-env',
    group: 'dev',
    pitch: 'Your AI coding agents use your API keys without ever seeing them.',
    detail:
      'The keys stay encrypted in pass, and each project lists only their names. Agents can run the app and push secrets to production, and the values never land in files, terminals or transcripts.',
    github: 'https://github.com/n8watkins/pass-env',
    credit: {
      author: { name: 'Phaedrus Raznikov', href: 'https://github.com/moomooskycow' },
      org: { name: 'Misty Step', href: 'https://github.com/misty-step' },
      note: 'my fork adds import, generate, doctor and more.',
    },
    tags: ['CLI', 'pass', 'GPG', 'Bun'],
    icon: ownToolIcon('pass-env'),
  },
  {
    id: 'release-kit',
    name: 'release-kit',
    group: 'dev',
    pitch: 'Conventional Commits, SemVer tags and GitHub Releases on any repo, with one command.',
    detail:
      'Release notes are written from the commits. An optional release train ships on a schedule, only when there is work a user would notice. This site releases with it.',
    github: 'https://github.com/n8watkins/release-kit',
    tags: ['CLI', 'Node', 'GitHub Actions'],
    icon: ownToolIcon('release-kit'),
  },
  {
    id: 'devguard',
    name: 'devguard',
    group: 'dev',
    pitch: 'Run many AI coding agents in parallel on one machine without running out of memory, ports or disk.',
    detail:
      'A watchdog stops runaway and finished dev servers, each worktree gets a stable port, heavy jobs wait for a free slot, and a sweep finds build output you can delete. Plain Python, no dependencies.',
    github: 'https://github.com/n8watkins/devguard',
    tags: ['CLI', 'Python', 'WSL'],
    icon: ownToolIcon('devguard'),
  },
  {
    id: 'pr-post',
    name: 'pr-post',
    group: 'featured',
    pitch: 'Follow what your favorite builders ship.',
    detail:
      'It turns their public GitHub and YouTube work into a small newspaper, The Pull Request Post, plus a feed.json for your own site. GitHub Actions prints a new edition twice a week.',
    github: 'https://github.com/n8watkins/pr-post',
    demo: 'https://n8watkins.github.io/pr-post/',
    tags: ['Python', 'GitHub Actions', 'GitHub Pages'],
    icon: ownToolIcon('pr-post'),
  },
]

/**
 * People I follow: what each one is working on in public. One entry per
 * person; adding one is adding an entry here. `id` is the anchor (on the
 * homepage, where People I follow lives since 2026-11-01) the tools
 * below link to ("no-mistakes, by Kun Chen").
 *
 * The cards are static for now. Later pr-post's feed.json fills each
 * person's `activity` with their recent public work: replace this array with
 * the fetched one, or merge the feed's items in by `id`. Only public events
 * belong here (public pull requests, releases, new repos), never counts of
 * private activity.
 */
export interface Person {
  id: string
  name: string
  /** Shown in the avatar circle, and behind the photo if it fails to load. */
  initials: string
  /**
   * Their avatar, self-hosted in public/people/ (256x256 WebP, the same
   * picture they use on their own channels), so no new image host is needed.
   */
  avatar?: string
  /** Who they are, in one sentence. */
  role: string
  /** What they are working on in public, in one or two plain sentences. */
  note: string
  /** Their own links only (from their channels or profiles); never a guessed one. */
  links: PersonLink[]
  /** Where they show how they work and their setup (a video). */
  howTheyWork?: { href: string }
  /** Their recent public activity, newest first; none until the feed exists. */
  activity?: PublicActivity[]
}

export interface PersonLink {
  kind: 'youtube' | 'x' | 'substack' | 'github' | 'website' | 'community'
  href: string
  /** The button's text, when the kind's default (YouTube, X, Website...) isn't enough. */
  label?: string
}

/** One public event, as the feed will send it. */
export interface PublicActivity {
  kind: 'pull-request' | 'release' | 'new-repo'
  /** The PR title, the release name or the repo's description. */
  title: string
  /** `owner/name`. */
  repo: string
  href: string
  /** ISO 8601. */
  date: string
}

export const people: Person[] = [
  {
    id: 'kun-chen',
    name: 'Kun Chen',
    initials: 'KC',
    avatar: '/people/kun-chen.webp',
    // Non-breaking spaces keep the last words together (no one-word last line).
    role: 'Former L8 principal engineer at Meta, Microsoft and\u00a0Atlassian.',
    // A non-breaking hyphen (U+2011) keeps "no-mistakes" from splitting across lines.
    note: 'Building agent tools in the open: no\u2011mistakes, firstmate, gnhf, treehouse and the AXI\u00a0interfaces.',
    howTheyWork: { href: 'https://youtu.be/iQyg-KypKAA' },
    links: [
      { kind: 'youtube', href: 'https://www.youtube.com/channel/UCb69t9ZkE5z1KvCmfJoaifA' },
      { kind: 'x', href: 'https://x.com/kunchenguid' },
      { kind: 'substack', href: 'https://kunchenguid.substack.com' },
      { kind: 'github', href: 'https://github.com/kunchenguid' },
    ],
  },
  {
    id: 'phaedrus',
    name: 'Phaedrus Raznikov',
    initials: 'PR',
    avatar: '/people/phaedrus.webp',
    role: 'Runs Misty Step, an AI-native software agency.',
    // From mistystack's README and mistystep.io (2026-11-01).
    note: 'Building what amounts to a software factory: mistystack, one method his agents load as skills across Claude Code, Codex and more, with builds and tests run on a fleet of workers. Misty Step ships its own games on it, and he created pass-env.',
    links: [
      { kind: 'x', href: 'https://x.com/moomooskycow' },
      { kind: 'github', href: 'https://github.com/moomooskycow' },
      { kind: 'website', href: 'https://www.mistystep.io/', label: 'Misty Step' },
    ],
  },
  {
    id: 'nate-herk',
    name: 'Nate Herk',
    initials: 'NH',
    avatar: '/people/nate-herk.webp',
    role: 'AI automation educator.',
    note: 'Teaching AI automation on YouTube and running the AI Automation Society community.',
    links: [
      { kind: 'youtube', href: 'https://www.youtube.com/@nateherk' },
      { kind: 'x', href: 'https://x.com/nateherk' },
      { kind: 'website', href: 'https://nateherk.com', label: 'nateherk.com' },
      { kind: 'community', href: 'https://www.skool.com/ai-automation-society/about', label: 'AI Automation Society' },
    ],
  },
]

/**
 * Other people's tools I use on top of Claude Code and Codex (the honorable
 * mentions joined them, 2026-11-02). Only tools in real use: herdr is where
 * my agents run, and most of the rest are wired into them as skills. `by`
 * names its maker from `people` when they are listed there. Every one has a
 * public repo, shown as its card's Star | GitHub button.
 */
export interface UsedTool {
  /** The anchor id on /loadout (My dev setup links to it). */
  id: string
  name: string
  whatFor: string
  /** The public repo (checked with `gh repo view`); it feeds the Star | GitHub button. */
  github: string
  /** Its own site, when it has one: the name links there, and a second button does too. */
  site?: string
  /** A `people` id: the maker, linked to their card. */
  by?: string
  /** A maker who isn't in `people`, linked to their own profile. */
  maker?: NamedLink
  icon: ReactElement
}

export const toolsIUse: UsedTool[] = [
  {
    id: 'herdr',
    name: 'herdr',
    whatFor:
      'The runtime my coding agents live on: persistent terminal sessions, every pane marked working, blocked or idle, and an API agents can drive.',
    github: 'https://github.com/herdrdev/herdr',
    site: 'https://herdr.dev',
    maker: { name: 'Can Celik', href: 'https://github.com/ogulcancelik' },
    // herdr's own app icon (the ram on its light tile), as herdr.dev's navbar
    // shows it (herdr.dev/live/icons/herdr.png, trimmed to the tile), kept in
    // public/brands/. A tile already, so it fills the chip, padding and all.
    icon: <Image src="/brands/herdr.png" alt="" width={130} height={130} sizes="42px" className="-m-2.5 size-[42px] max-w-none rounded-[11px]" />,
  },
  {
    id: 'no-mistakes',
    name: 'no-mistakes',
    whatFor: 'A git remote that checks my work first: an AI pipeline reviews, tests and fixes a branch before it is pushed, then opens the pull request.',
    github: 'https://github.com/kunchenguid/no-mistakes',
    by: 'kun-chen',
    icon: <LuShieldCheck />,
  },
  {
    id: 'chrome-devtools-axi',
    name: 'chrome-devtools-axi',
    whatFor: 'A browser my agents can drive: they open pages, click through flows and take screenshots to check their own UI work.',
    github: 'https://github.com/kunchenguid/chrome-devtools-axi',
    by: 'kun-chen',
    icon: <LuGlobe />,
  },
  {
    id: 'gh-axi',
    name: 'gh-axi',
    whatFor: 'The GitHub CLI, reshaped for agents: issues, pull requests and CI runs in short output they can act on.',
    github: 'https://github.com/kunchenguid/gh-axi',
    by: 'kun-chen',
    icon: <SiGithub />,
  },
  {
    id: 'firstmate',
    name: 'firstmate',
    whatFor: 'Talk to one agent, ship with a crew: it runs several project tasks in parallel, so you stop juggling terminal tabs.',
    github: 'https://github.com/kunchenguid/firstmate',
    by: 'kun-chen',
    icon: <LuShip />,
  },
  {
    id: 'treehouse',
    name: 'treehouse',
    whatFor:
      'Manage worktrees without managing worktrees: a pool of reusable ones, so each agent starts in its own copy with dependencies and build cache intact.',
    github: 'https://github.com/kunchenguid/treehouse',
    by: 'kun-chen',
    icon: <LuTrees />,
  },
  {
    id: 'ccusage',
    name: 'ccusage',
    whatFor: 'Token and cost reports for Claude Code and other coding agent CLIs, read from their local logs.',
    github: 'https://github.com/ccusage/ccusage',
    maker: { name: 'ryoppippi', href: 'https://github.com/ryoppippi' },
    icon: <LuChartColumn />,
  },
]


/** A brand whose mark is a wordmark (AMD, Samsung, Acer) is drawn wider in The gear, so it reads (as in My dev setup). */
const GEAR_WORDMARK = '-my-1.5 size-8!'
// The Stream Kit group (OBS Studio, Scribe) left on 2026-11-02 (round 3): Scribe
// is in Tools I built and use; /loadout#stream lands on The gear.
export const loadout: LoadoutGroup[] = [
  {
    id: 'rig',
    title: 'The Rig',
    subtitle: 'The battlestation. A build is just a loadout you can touch.',
    accent: 'indigo',
    path: '~/loadout/rig',
    items: [
      {
        name: 'AMD Ryzen 7 9700X',
        icon: <SiAmd className={GEAR_WORDMARK} />,
        whatFor: '8 Zen 5 cores / 16 threads for compiling, local models, and three dev servers at once.',
        take: 'Zen 5 runs cool and fast - efficient enough that the fans stay quiet under a full build.',
      },
      {
        name: 'Radeon RX 7800 XT (16GB)',
        icon: <SiAmd className={GEAR_WORDMARK} />,
        whatFor: 'Local inference, encoding the stream without dropping frames, and the occasional game.',
        take: '16GB of VRAM is the sweet spot - room for decent local models and still stream clean.',
      },
      {
        name: '32GB DDR5\u20116000 (CL32)',
        icon: <LuMemoryStick />,
        whatFor: 'Chrome, Docker, a local LLM, and OBS all wanting to be friends at the same time.',
        take: 'G.Skill DDR5 - RAM is cheap, closing tabs is expensive. Easy call.',
      },
      {
        name: 'Samsung 990 PRO 2TB',
        icon: <SiSamsung className={GEAR_WORDMARK} />,
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
        icon: <SiAcer className={GEAR_WORDMARK} />,
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


/** One thing in My dev setup: a link when it has a page here or a card on /loadout. */
export interface SetupEntry {
  name: string
  /**
   * Its own mark: the tool's or product's real icon (Simple Icons, a
   * vendor's own glyph pack, or a file in public/), in its brand colour
   * (white for a black mark, so it reads on the dark page); a plain glyph
   * only for what has no mark (RAM, cores, a setting) or no public icon.
   */
  icon: ReactElement
  /** A few words after the name: what it is or what it does. */
  note?: string
  href?: string
}

/** A brand mark in its own colour. */
const mark = (Icon: IconType, color: string) => <Icon style={{ color }} />
/** Black marks (OpenAI, Vercel, Rust) read light on the dark page, as in the AI kit. */
const LIGHT = '#e6edf6'
/** An app icon from public/, at the chips' 16px. */
const appIcon = (src: string) => <Image src={src} alt="" width={16} height={16} unoptimized={src.endsWith('.svg')} />

/**
 * My dev setup: the machine, WSL, terminal, editors, agents and the rest,
 * grouped and scannable, as a bento of tiles; a tile holds one group or a
 * few that belong together. Rebalanced on 2026-11-02 (the owner's ask: the
 * Machine tile was mostly empty beside a tall WSL2 one, and Editors and
 * Agents were near-empty tiles): the order is set so that, three tiles to a
 * row from 1280px and two below, the tiles sharing a row hold about as much,
 * and every row fills.
 */
export interface DevSetupGroup {
  id: string
  title: string
  items: SetupEntry[]
}

export interface DevSetupTile {
  id: string
  groups: DevSetupGroup[]
  /** A config file shown beside the groups (under them on a phone). */
  code?: { label: string; text: string }
  /** The full width of the grid, at every size. */
  full?: boolean
}

export const devSetup: DevSetupTile[] = [
  {
    // The machine and the Linux it runs, with WSL's config beside them.
    id: 'machine',
    full: true,
    code: {
      label: '.wslconfig',
      text: ['[wsl2]', 'networkingMode=mirrored', 'memory=20GB', 'processors=8', 'swap=16GB', '', '[experimental]', 'autoMemoryReclaim=dropcache', 'sparseVhd=true'].join('\n'),
    },
    groups: [
      {
        id: 'machine',
        title: 'Machine',
        items: [
          // AMD's mark is its wordmark, a thin band across a square: drawn wider (its
          // height still the chips' 16px) so it reads.
          { name: 'AMD Ryzen 7 9700X', note: '8 cores', icon: <SiAmd style={{ color: LIGHT }} className="-my-[7px] size-[30px]!" /> },
          { name: '31 GB RAM', icon: <LuMemoryStick /> },
          { name: 'Windows 11 Pro', icon: mark(FaWindows, '#0078d4') },
        ],
      },
      {
        id: 'wsl',
        title: 'WSL2',
        items: [
          { name: 'Ubuntu 24.04', icon: mark(SiUbuntu, '#e95420') },
          { name: '20 GB RAM', note: '+ 16 GB swap', icon: <LuMemoryStick /> },
          { name: '8 processors', icon: <LuCpu /> },
          { name: 'Mirrored networking', icon: <LuNetwork /> },
          { name: 'Memory reclaim', note: 'dropcache', icon: <LuRecycle /> },
          { name: 'Sparse VHD', icon: <LuHardDrive /> },
        ],
      },
    ],
  },
  {
    id: 'terminal',
    groups: [
      {
        id: 'terminal',
        title: 'Terminal',
        items: [
          // Windows Terminal's own icon, from its repo (microsoft/terminal, res/terminal/Terminal.svg).
          { name: 'Windows Terminal', icon: appIcon('/brands/windows-terminal.svg') },
          { name: 'zsh + oh-my-zsh', note: 'zsh-autosuggestions', icon: mark(SiZsh, '#f15a24') },
          { name: 'tmux', icon: mark(SiTmux, '#1bb91f') },
          { name: 'herdr', note: 'agent multiplexer', href: '#herdr', icon: appIcon('/brands/herdr.png') },
        ],
      },
      {
        // Everyday apps (round 5 of 2026-11-02): one chip for the suite, not one per app. Beside the
        // terminal: the placement that keeps every row of the bento even (measured at 820 to 1440px).
        id: 'workspace',
        title: 'Workspace',
        items: [{ name: 'Google Workspace', note: 'Gmail, Calendar, Drive and Docs', icon: mark(SiGoogle, '#4285f4') }],
      },
    ],
  },
  {
    id: 'own-tools',
    groups: [
      {
        id: 'own-tools',
        title: 'My own tools, in daily use',
        items: [
          // My own tools' marks come from OWN_TOOL_ICONS, the same as their cards in Tools I built and use.
          { name: 'T-Hub', note: 'supervises my Claude Code sessions', icon: ownToolIcon('t-hub') },
          // The site presents Scribe through its build page, not its site's repo.
          { name: 'Scribe', note: 'local dictation for Windows, Mac and Linux', href: '/builds/scribe', icon: appIcon('/builds/scribe/app-icon.png') },
          { name: 'devguard', href: '#devguard', icon: ownToolIcon('devguard') },
          { name: 'pass-env', href: '#pass-env', icon: ownToolIcon('pass-env') },
          { name: 'release-kit', href: '#release-kit', icon: ownToolIcon('release-kit') },
          { name: 'N8 Tray', note: 'private', icon: ownToolIcon('n8-tray') },
        ],
      },
    ],
  },
  {
    // Two small groups, one tile: what I edit in and the agents that edit with me.
    id: 'editors-agents',
    groups: [
      {
        id: 'editors',
        title: 'Editors',
        // No Cursor (the owner's call, 2026-11-01).
        items: [
          { name: 'Neovim', icon: mark(SiNeovim, '#57a143') },
          // VS Code's own mark, from Microsoft's codicons (Simple Icons has no Microsoft logos).
          { name: 'VS Code', icon: mark(VscVscode, '#22a6f2') },
        ],
      },
      {
        id: 'agents',
        title: 'Agents',
        items: [
          { name: 'Claude Code', href: '#workflow', icon: mark(SiClaude, '#d97757') },
          { name: 'Codex', href: '#workflow', icon: mark(BsOpenai, LIGHT) },
        ],
      },
    ],
  },
  {
    id: 'agent-tooling',
    groups: [
      {
        id: 'agent-tooling',
        title: 'Agent tooling',
        items: [
          // The marks their cards in Tools I use carry.
          { name: 'no-mistakes', href: '#no-mistakes', icon: <LuShieldCheck /> },
          { name: 'gh-axi', href: '#gh-axi', icon: <SiGithub /> },
          { name: 'chrome-devtools-axi', href: '#chrome-devtools-axi', icon: <LuGlobe /> },
          // Sentry's own CLI, which my agents drive through its skill to read this site's errors
          // (round 5 of 2026-11-02; a setup chip, not a Tools I use card). Its repo is the link.
          { name: 'Sentry CLI', note: 'with its agent skill', href: 'https://github.com/getsentry/cli', icon: mark(SiSentry, '#a39ad8') },
        ],
      },
    ],
  },
  {
    id: 'runtimes',
    groups: [
      {
        id: 'runtimes',
        title: 'Runtimes',
        items: [
          { name: 'Node 24', note: 'nvm', icon: mark(SiNodedotjs, '#5fa04e') },
          { name: 'pnpm', icon: mark(SiPnpm, '#f69220') },
          { name: 'Bun', icon: mark(SiBun, '#fbf0df') },
          { name: 'Python 3.12', note: 'uv', icon: mark(SiPython, '#4b8bbe') },
          { name: 'Rust', icon: mark(SiRust, LIGHT) },
        ],
      },
    ],
  },
  {
    id: 'shipping',
    groups: [
      {
        id: 'shipping',
        title: 'Shipping',
        items: [
          { name: 'Vercel', icon: mark(SiVercel, LIGHT) },
          { name: 'Cloudflare', note: 'Wrangler', icon: mark(SiCloudflare, '#f38020') },
          { name: 'Turso', icon: mark(SiTurso, '#4ff8d2') },
        ],
      },
    ],
  },
]
