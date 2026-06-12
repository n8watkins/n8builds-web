import { projects, techNameMapping } from './projects'

export interface BuildStackItem {
  name: string
  detail: string
}

export interface BuildImage {
  src: string
  alt: string
}

export interface Build {
  slug: string
  name: string
  tagline: string
  category: string
  status?: 'shipped' | 'in the lab'
  tags: string[]
  color: string
  problem: string
  solution: string
  stack: BuildStackItem[]
  process: string[]
  images: BuildImage[]
  github?: string
  liveSite?: string
}

// Appturnity already has full data in data/projects.tsx — derive instead of duplicating.
const appturnityProject = projects.find(p => p.title === 'Appturnity')
const appturnityImages: BuildImage[] = (appturnityProject?.images ?? []).map((src, i) => ({
  src,
  alt: `Appturnity screenshot ${i + 1}`,
}))
const appturnityStack: BuildStackItem[] = Object.values(appturnityProject?.technologies ?? {}).flatMap(group =>
  group.descriptionParts.map(part => ({
    name: part.icons
      .map(({ icon }) => techNameMapping[icon as keyof typeof techNameMapping] ?? icon)
      .join(' · '),
    detail: part.text,
  }))
)

export const builds: Build[] = [
  {
    slug: 'asset-arsenal',
    name: 'Asset Arsenal',
    tagline: 'AI icon extraction workbench',
    category: 'Web app',
    tags: ['Next.js', 'AI', 'TypeScript'],
    color: 'from-cyan-500/20 to-blue-600/20',
    problem:
      'Pulling a matching icon set out of a single reference image — a brand sheet, a screenshot, a mockup — is slow manual work, and one-shot AI generation loses style consistency across the set: every icon comes back looking like it belongs to a different family.',
    solution:
      'A six-step OpenAI pipeline: a vision model detects the icons, a collection image is generated as the visual style anchor, then each icon is regenerated as a clean, transparent standalone asset using that anchor as a reference image. It is a workbench, not a black box — every step is an independent, rerunnable breakpoint with full JSON visibility.',
    stack: [
      { name: 'Next.js · TypeScript', detail: 'App Router frontend and the six pipeline API routes' },
      { name: 'OpenAI API', detail: 'Vision analysis, prompt composition, and image generation via images.edit with reference images' },
      { name: 'Tailwind CSS', detail: 'Workbench UI with per-step sections' },
      { name: 'Zod', detail: 'Schema validation across every pipeline payload' },
      { name: 'IndexedDB', detail: 'Local gallery of source images and generated icons' },
    ],
    process: [
      'The key insight: images.edit accepts a reference image, images.generate does not — so the collection image becomes the style anchor that steps 4 and 5 pass back to the model.',
      'Each pipeline step shows its resolved prompt before running and feeds its output into the next, so any stage can be tuned and rerun in isolation.',
      'All per-step prompts live in one file (lib/icon/prompts.ts) and model roles plus cost guardrails in another — tuning the pipeline never means hunting through routes.',
      'The API key stays server-side only; the UI renders fine without one, failing loudly only on actual OpenAI calls.',
    ],
    images: [],
  },
  {
    slug: 'vibelog',
    name: 'VibeLog',
    tagline: 'Live coding telemetry & OBS overlay',
    category: 'Streaming tool',
    tags: ['Node.js', 'OBS', 'TypeScript'],
    color: 'from-blue-500/20 to-cyan-600/20',
    problem:
      'Streaming "building in public" gives viewers no live signal of what is actually happening: git activity, Claude token spend, and session time all live in different tools, and the post-stream recap is a manual chore.',
    solution:
      'One local Node process that tracks git activity, AI token spend, stream time, and channel growth — and serves a live HUD as an OBS browser source, a private dashboard, a public /live page, and shareable /share cards. Local-first, no accounts, $0.',
    stack: [
      { name: 'Node.js · TypeScript', detail: 'Single local agent process that watches git and session state' },
      { name: 'OBS Browser Source', detail: 'Transparent 1920×1080 HUD served at localhost:4545/overlay' },
      { name: 'CLI', detail: 'vibe start / mark / status / report — drive the overlay from a second terminal while coding' },
    ],
    process: [
      'Markers are first-class: "vibe mark feature/bug" annotates the session live, and the end-of-day report is built entirely from the local log — no AI, no network.',
      'A demo mode seeds fake data so the whole overlay can be previewed without a real git repo or session.',
      'Direction lives in a canonical VISION.md; earlier spec docs are kept but explicitly marked historical.',
      'This is the tool behind the "LIVE on VibeLog" badge planned for this site\'s hero.',
    ],
    images: [],
  },
  {
    slug: 'chrome-extension-kit',
    name: 'Chrome Extension Launch Kit',
    tagline: 'Config-driven Manifest V3 starter',
    category: 'Starter template',
    tags: ['WXT', 'React', 'MV3'],
    color: 'from-blue-500/20 to-cyan-600/20',
    problem:
      'Every new Chrome extension restarts from the same boilerplate: popup and options scaffolding, a settings system, a permissions story, a data inventory, and a release-readiness checklist — rebuilt slightly worse each time.',
    solution:
      'A config-driven Manifest V3 starter built on WXT, React, and TypeScript. Clone it, run setup, and edit one file — extension.config.ts — which controls project metadata, tier, links, permissions, capabilities, data inventory, and developer panels.',
    stack: [
      { name: 'WXT', detail: 'MV3 build tooling, dev server, and zip packaging' },
      { name: 'React · TypeScript', detail: 'Structured popup and options pages' },
      { name: 'extension.config.ts', detail: 'Single config file driving the whole template' },
    ],
    process: [
      'Three deliberate quality tiers — Internal, Public Source, Public Product — so a weekend tool and a Web Store release have different (documented) bars.',
      'V1 is intentionally a template, not a builder: no analytics, no feedback backend, no store automation. Boundaries are written down in the PRD.',
      'A check:extension health command verifies the config and release readiness before shipping.',
      'Born from the patterns repeated across Piper TTS, TL;DW, and TubeVault — this kit is those lessons, extracted.',
    ],
    images: [],
  },
  {
    slug: 'piper-tts',
    name: 'Piper TTS',
    tagline: 'Fully local read-aloud for Chrome',
    category: 'Chrome extension',
    tags: ['Chrome', 'Piper', 'Local AI'],
    color: 'from-green-500/20 to-teal-600/20',
    problem:
      'Read-aloud tools are cloud-bound: subscriptions, API keys, and your reading habits shipped to someone else\'s server — just to hear a paragraph of text.',
    solution:
      'Highlight text on any page, right-click, and it is read aloud by a Piper TTS model running entirely on your own machine. A browser-TTS fallback works instantly with zero setup, so the extension is useful before the local server is even installed. No cloud, no API keys, no data leaves your computer.',
    stack: [
      { name: 'Chrome MV3', detail: 'Service worker for the context menu plus an offscreen document for audio playback' },
      { name: 'React', detail: 'Popup and options UI — profiles, voices, settings, credits' },
      { name: 'Node.js + Piper', detail: 'Local server wrapping the Piper neural TTS engine and its voice models' },
      { name: 'esbuild', detail: 'Bundles the React UI into the extension' },
    ],
    process: [
      'MV3 killed background audio, so playback runs in an offscreen document — one of those Chrome-platform quirks you only learn by hitting it.',
      'Voice profiles bundle voice, speed, and volume so switching between a fast skim-voice and a slow listen-voice is one click.',
      'Screenshots are generated by a Puppeteer script that runs from WSL but drives Windows Chrome — the same automation pattern shared with TubeVault.',
      'A git pre-commit hook keeps the built dist/ in sync with src/, so the loadable extension never drifts from the source.',
    ],
    images: [
      { src: '/builds/piper-tts/popup.png', alt: 'Piper TTS popup with profile, speed, volume, test, and stop controls' },
      { src: '/builds/piper-tts/options-profiles.png', alt: 'Piper TTS options — voice profiles tab' },
      { src: '/builds/piper-tts/options-voices.png', alt: 'Piper TTS options — voices tab' },
      { src: '/builds/piper-tts/options-settings.png', alt: 'Piper TTS options — settings tab with fallback and shortcuts' },
    ],
    github: 'https://github.com/n8watkins/piper-tts',
  },
  {
    slug: 'tldw',
    name: 'TL;DW',
    tagline: 'One-keystroke YouTube → Gemini',
    category: 'Chrome extension',
    tags: ['Chrome', 'Gemini', 'TypeScript'],
    color: 'from-orange-500/20 to-yellow-600/20',
    problem:
      'A 40-minute video might hold two minutes of answer. Getting an AI summary means copying the URL, opening a chat tab, retyping the same prompt — every single time.',
    solution:
      'Too Long; Didn\'t Watch: on any YouTube video or Short, press Alt+G. TL;DW opens Gemini, injects a saved prompt profile with the video URL, and submits it. Built-in profiles cover summary, research, learning, tutorial extraction, and moment finding — with a clipboard fallback if Gemini\'s composer can\'t be filled.',
    stack: [
      { name: 'Chrome MV3 · TypeScript', detail: 'Detects watch pages and Shorts, builds and injects the prompt' },
      { name: 'Vite', detail: 'Dev server and extension build' },
      { name: 'Prompt profiles', detail: 'Editable, persistent prompt templates with a default per use case' },
    ],
    process: [
      'Deliberately zero-surface: no backend, no analytics, no YouTube OAuth, no Gemini API key. History stays in Chrome local storage, and Gemini responses are never read or stored.',
      'Every build auto-bumps the patch version and copies to the Windows folder Chrome loads from — the version in the popup proves a reload actually picked up the new build.',
      'Roadmap: a per-search "curiosity field", transcript-aware prompts, and a BYO-key API mode only if response saving earns the extra surface area.',
    ],
    images: [],
    github: 'https://github.com/n8watkins/tl-dw',
  },
  {
    slug: 'tubevault',
    name: 'TubeVault',
    tagline: 'Local-first YouTube archiver',
    category: 'Chrome extension',
    tags: ['Chrome', 'yt-dlp', 'React'],
    color: 'from-red-500/20 to-rose-600/20',
    problem:
      'Playlists rot. Videos go private, channels disappear, and the watch-later library you curated for years is one takedown away from gone — unless you hand your whole library to some third-party downloader site.',
    solution:
      'A Chrome extension that adds archive controls directly to YouTube watch, Shorts, playlist, and channel pages, with a native-messaging helper that runs yt-dlp locally in WSL. Pick components (video, audio, metadata, thumbnails), set quality preferences, and playlists expand into per-video jobs in a visible download queue. No remote server involved.',
    stack: [
      { name: 'Chrome MV3 · React', detail: 'Content script UI on YouTube pages, popup queue, and options/history pages' },
      { name: 'Node.js helper', detail: 'Native-messaging host that drives yt-dlp in WSL' },
      { name: 'yt-dlp', detail: 'The actual download engine — videos, thumbnails, and metadata' },
      { name: 'PowerShell', detail: 'Installer that registers the native messaging host on Windows' },
    ],
    process: [
      'The split architecture is the whole trick: the extension never downloads anything itself — it hands jobs across Chrome\'s native-messaging bridge to a local helper, keeping the Web Store surface clean.',
      'Playlist and channel requests expand into per-video jobs, so a 300-video playlist is a queue you can watch drain, not a black box.',
      'A built-in Setup tab walks through the native host install — the part of local-first tools that usually loses people.',
      'Versioned like a real product: changelog, screenshots in the repo, v0.3.x and counting.',
    ],
    images: [
      { src: '/builds/tubevault/tubevault-popup.png', alt: 'TubeVault popup showing active downloads and queued work' },
      { src: '/builds/tubevault/tubevault-options-downloads.png', alt: 'TubeVault options — download history' },
      { src: '/builds/tubevault/tubevault-options-status.png', alt: 'TubeVault options — helper status panel' },
      { src: '/builds/tubevault/tubevault-options-setup.png', alt: 'TubeVault options — setup checklist' },
    ],
    github: 'https://github.com/n8watkins/tube-vault',
  },
  {
    slug: 'appturnity',
    name: 'Appturnity',
    tagline: 'Software consulting platform',
    category: 'Web app',
    tags: ['Vite', 'Express', 'TypeScript'],
    color: 'from-sky-500/20 to-indigo-600/20',
    problem:
      'Small businesses with a genuine software idea face agency-sized quotes and a scoping process built for enterprises. Most walk away — or overpay for something simpler than they needed.',
    solution:
      'A consulting funnel that helps clients validate and scope new software ideas in a clear, modern layout: what the build actually requires, what it costs, and a direct line to start the conversation. This is the client-work arm of the three-brand ecosystem.',
    stack: appturnityStack,
    process: [
      'Built and deployed on Replit for the fastest possible idea-to-live loop, then iterated against real client conversations.',
      'The intake flow is the product: the site\'s job is to turn "I have an app idea" into a scoped, honest conversation.',
      'Lives at appturnity.web.app and is one of the two bridge destinations this site funnels into (the other being the developer portfolio).',
    ],
    images: appturnityImages,
    github: appturnityProject?.github,
    liveSite: appturnityProject?.liveSite,
  },
  {
    slug: 'jobsignal',
    name: 'JobSignal',
    tagline: 'AI-powered job application tracker',
    category: 'Web app + extension',
    tags: ['Next.js', 'Prisma', 'Chrome'],
    color: 'from-emerald-500/20 to-cyan-600/20',
    problem:
      'Job hunting scatters across tabs and spreadsheets: which roles you applied to, what the job description said, when to follow up. By application #40, the tracking overhead competes with the applying.',
    solution:
      'Everything hangs off one core action — Mark Applied: capture the job, create the application, store the JD, queue AI analysis, and add a timeline event, in one click from a Chrome extension with a LinkedIn extractor. A Next.js dashboard holds the pipeline and per-application timelines.',
    stack: [
      { name: 'Next.js · TypeScript', detail: 'App Router dashboard and API routes' },
      { name: 'Prisma', detail: 'Application, job, and timeline data model' },
      { name: 'Chrome MV3', detail: 'Mark Applied extension with LinkedIn and generic extractors' },
      { name: 'Zod', detail: 'Shared schemas package keeping web, extension, and API in lockstep' },
    ],
    process: [
      'Monorepo with apps/web, apps/extension, and packages/shared — one set of Zod schemas is the contract between all three.',
      'V1 deliberately stubs the expensive parts (Gmail OAuth, real AI calls, production auth) so the core loop could be proven first.',
      'Security posture written down before code: no Gmail send/delete scopes, archive only on explicit confirmation, encrypt tokens before production.',
    ],
    images: [],
    github: 'https://github.com/n8watkins/jobsignal',
  },
  {
    slug: 'localdictate',
    name: 'LocalDictate',
    tagline: 'Privacy-first local speech-to-text',
    category: 'Desktop app',
    tags: ['Tauri', 'Rust', 'Whisper'],
    color: 'from-slate-500/20 to-blue-600/20',
    problem:
      'Dictation tools stream your voice to the cloud and charge a subscription for the privilege. For something you might use in every app, all day, that is a lot of audio leaving your machine.',
    solution:
      'Hold a hotkey, talk, release — words are transcribed on your own machine by whisper.cpp and inserted wherever your cursor is. Push-to-talk and hands-free toggle modes, a draggable always-on-top status pill, live transcription while you are still talking, and searchable history in a local SQLite database. No cloud, no account, no audio ever leaves the PC.',
    stack: [
      { name: 'Tauri v2 · Rust', detail: 'Windows app: global hotkeys, tray, audio capture, text insertion' },
      { name: 'whisper.cpp', detail: 'Local transcription — whisper-server keeps the model warm in RAM between dictations' },
      { name: 'SQLite', detail: 'Transcript history and stats with retention controls' },
      { name: 'WebView2', detail: 'Dashboard UI, bootstrapped automatically by the installer' },
    ],
    process: [
      'The warm-transcriber design is the speed trick: whisper-server holds the model in memory so transcription starts instantly, with whisper-cli as the fallback path.',
      'Live transcription runs phrase-by-phrase in the background while you talk, so text is ready the moment you release the hotkey.',
      'Deliberately Windows x64 only — written into the README as a non-goal rather than over-building for platforms nobody asked for.',
      'Privacy is mechanical, not a promise: temp audio is deleted after transcription, and the only network access is the one-time model download you trigger yourself.',
    ],
    images: [],
    github: 'https://github.com/n8watkins/localdictate',
  },
  {
    slug: 'solara',
    name: 'Solara',
    tagline: 'Know your sun window',
    category: 'Web app',
    tags: ['Next.js', 'Firebase', 'Open-Meteo'],
    color: 'from-yellow-500/20 to-orange-600/20',
    problem:
      'The UV index is a number, not an answer. Whether you can be outside without sunscreen depends on your skin type, the activity, and how long you will be out — none of which a weather app accounts for.',
    solution:
      'A personalized UV and sun-exposure dashboard: enter location, skin type, and outdoor activities, and Solara computes your safe sun windows for today and tomorrow — including a no-sunscreen mode that shows exactly when UV is low enough. Activity windows can flow straight into Google Calendar.',
    stack: [
      { name: 'Next.js', detail: 'App Router with static export' },
      { name: 'Open-Meteo', detail: 'Live UV and weather data — free, no API key' },
      { name: 'Firebase', detail: 'Auth, Firestore sync, and hosting' },
      { name: 'GitHub Actions', detail: 'CI/CD deploys to Firebase Hosting' },
    ],
    process: [
      'Anonymous-first: location is saved locally and the whole app works without an account; Google sign-in only adds cross-device sync.',
      'Static export keeps hosting free and fast — all personalization happens client-side against the Open-Meteo API.',
      'Safe windows are computed per activity and skin type, with durations adjustable in preferences.',
    ],
    images: [{ src: '/builds/solara/og-image.png', alt: 'Solara — know your sun window' }],
    github: 'https://github.com/n8watkins/solara',
  },
  {
    slug: 'suggestion-box',
    name: 'Suggestion Box',
    tagline: 'Community feedback tool',
    category: 'Web app',
    status: 'in the lab',
    tags: ['Next.js', 'Postgres', 'TypeScript'],
    color: 'from-cyan-500/20 to-blue-600/20',
    problem:
      'Feedback from a community — stream viewers, beta users, friends kicking the tires — arrives scattered across Discord messages and chat scroll, then evaporates. The good ideas are gone by next session.',
    solution:
      'A small, self-hosted suggestion box: one place to drop ideas and one place to review them. Deliberately lightweight — the kind of tool that should take minutes to use and zero accounts to contribute to.',
    stack: [
      { name: 'Next.js · TypeScript', detail: 'App and API in one deployable' },
      { name: 'PostgreSQL', detail: 'Suggestions live in a real database from day one' },
    ],
    process: [
      'Early-stage lab build — the scope is intentionally tiny, and this page will grow as it does.',
      'Built in public: progress lands on stream first.',
    ],
    images: [],
  },
  {
    slug: 'repo-steward',
    name: 'Repo Steward',
    tagline: 'Deterministic repo-health bot',
    category: 'GitHub Actions bot',
    tags: ['Node.js', 'GitHub Actions', 'Bot'],
    color: 'from-blue-500/20 to-indigo-600/20',
    problem:
      'Repo hygiene decays silently: env vars used in code but missing from .env.example, docs drifting from the code they describe, API routes without validation, TODO debt piling up. AI review bots can catch this — at a per-call price, forever.',
    solution:
      'A free, deterministic GitHub Actions maintenance bot. No LLM calls at all: TypeScript scanner scripts compare changed files, check patterns, and post findings as a markdown report or PR comment — env drift, doc drift, missing validation keywords, AI usage without cost guardrails, risky files touched, large files creeping in.',
    stack: [
      { name: 'GitHub Actions', detail: 'Two workflows: scheduled repo health plus per-PR checks' },
      { name: 'TypeScript · Node.js', detail: 'Deterministic scanner scripts — the entire analysis engine' },
      { name: 'maintainer.config.json', detail: 'Per-repo tuning of which checks run and how strict' },
    ],
    process: [
      'V1 is intentionally boring: useful with zero model usage and zero API credits, which also makes every finding reproducible.',
      'Install is copy-paste — two workflow files, the scanner source, and a config — no hosted service to trust.',
      'One check watches for AI-provider usage missing cost guardrails (timeouts, rate limits, max input length) — a lesson from the AI builds, encoded as a lint.',
      'V2 may add AI strictly as an explanation layer on top of deterministic findings, never as the detector.',
    ],
    images: [],
    github: 'https://github.com/n8watkins/repo-steward',
  },
]

export function getBuild(slug: string): Build | undefined {
  return builds.find(b => b.slug === slug)
}
