import type { TechKey } from '@/lib/tech-icons'

/** Where a piece of the stack sits, for the tabs of a build page's "How it's built". */
export type BuildLayer = 'Frontend' | 'Backend' | 'Cloud'

export interface BuildStackItem {
  name: string
  detail: string
  layer: BuildLayer
  /** The technologies' marks, shown on the card and the page's tech pills (lib/tech-icons.tsx). */
  tech?: TechKey[]
}

export interface BuildImage {
  src: string
  alt: string
}

export interface BuildAction {
  label: string
  href: string
  /** One of lib/downloads.ts's DOWNLOADS: a download mark, and what you get under the button. */
  download?: string
  /** A text link under the buttons instead of a button. */
  quiet?: boolean
}

/** A clip: VP9 WebM first, H.264 MP4 for browsers without it, the poster, and what it shows. */
export interface BuildClip {
  webm: string
  mp4: string
  poster: string
  alt: string
}

export interface Build {
  slug: string
  name: string
  tagline: string
  category: string
  status?: 'shipped' | 'in the lab'
  /**
   * One of the owner's daily drivers (Scribe): a row in /loadout's "My daily
   * drivers", not the Lab, whatever its category.
   */
  mine?: boolean
  /**
   * `false`: not on the homepage (Portfolio Rank, which moved to the developer
   * portfolio on 2026-11-08). Its page stays, listed in the /builds index, and
   * leads back there.
   */
  homepage?: false
  tags: string[]
  /**
   * What the build does, as a checklist near the top of its page. A feature
   * with a `shot` (one of `images`, by src) shows that screenshot beside it
   * (owner, 2026-11-08).
   */
  highlights?: (string | { text: string; shot: string })[]
  color: string
  /** The problem the build solves, shown on its page (the n8builds case study has none). */
  problem?: string
  solution: string
  stack: BuildStackItem[]
  process: string[]
  images: BuildImage[]
  /**
   * A short silent clip of the product in use (scripts/product-clips/), shown
   * full width under the page's header in place of a still, and its `phone`
   * take: the same use on a phone, for the stage's Phone view and for phones.
   */
  clip?: BuildClip & { phone?: BuildClip }
  /**
   * Where "Try it live" beside the clip goes (owner, 2026-11-09): the real
   * product, in a new tab, on a page that needs no sign-up. Never embedded.
   */
  tryLive?: string
  /** People and projects the build stands on, credited with links on its page. */
  credits?: { name: string; href: string; note: string }[]
  /**
   * An invitation lower on the build's page, for a door its header doesn't
   * already open (Portfolio Rank: add your portfolio).
   */
  cta?: { heading: string; body: string; label: string; href: string }
  /**
   * The one main action, to the live thing: the app, the download or the
   * product's landing page when that is the product (owner, 2026-11-08). The
   * Lab row's primary button and the first action on the build's page.
   */
  tryIt?: BuildAction
  /**
   * More ways in, on the build's page only, never on its Lab row (OpenPing's
   * free tools and install guide; owner, 2026-11-08). `quiet` ones are a text
   * link under the buttons.
   */
  moreActions?: BuildAction[]
  github?: string
  liveSite?: string
  /**
   * `liveSite` is the product's landing page, not the app itself (Scribe's,
   * OpenPing's and Solara's): its build page says "Visit the landing page", not
   * "Visit live site" (round 4 of 2026-11-02).
   */
  liveSiteIsLanding?: boolean
  /**
   * The GitHub repo (`owner/name`) that feeds this build's entries in the
   * /builds log. The builds with a `repo` are the single list of tracked repos
   * (scripts/check-build-repos.mjs reads it too).
   */
  repo?: string
  /**
   * What the log shows from `repo`: `commits` (the default) shows releases and
   * the filtered commits between them, `releases` only releases (GitHub
   * Releases and version-bump commits), `off` nothing.
   */
  log?: 'releases' | 'commits' | 'off'
  /**
   * Log entries to hide: any commit-based entry whose title contains one of
   * these (case-insensitive). The escape hatch for a commit the filters let
   * through that shouldn't be public.
   */
  logHide?: string[]
}

export const builds: Build[] = [
  {
    // Called Piper TTS until 2026-11-02 (its repo was n8watkins/piper-tts); /builds/piper-tts redirects here.
    slug: 'voicedock',
    name: 'VoiceDock',
    tagline: 'Read any page aloud, locally',
    category: 'Chrome extension',
    tags: ['Chrome', 'Piper', 'Kokoro', 'Local AI'],
    highlights: [
      { text: 'Highlight text, right-click or press Alt+Shift+R, and hear it read aloud', shot: '/builds/voicedock/popup.png' },
      { text: 'Two voice engines on your own machine: Piper (fast) or Kokoro (54 voices, 9 languages)', shot: '/builds/voicedock/options-voices.png' },
      { text: "Works at once with the browser's voice, and falls back to it when an engine is off", shot: '/builds/voicedock/options-settings.png' },
      { text: 'Voice profiles that pick the engine, voice, speed and volume', shot: '/builds/voicedock/options-profiles.png' },
      'No cloud and no API keys: no text leaves your computer',
    ],
    color: 'from-green-500/20 to-teal-600/20',
    problem:
      "Read-aloud tools send your text to someone else's server and want a subscription or an API key.",
    solution:
      "VoiceDock reads any highlighted text aloud with a voice running on your own machine: Piper or Kokoro, chosen per profile. The browser's own voice covers the gaps, and no text leaves your computer.",
    stack: [
      { name: 'Chrome MV3', layer: 'Frontend', detail: 'Service worker for the context menu and shortcuts, plus an offscreen document for audio playback', tech: ['chrome'] },
      { name: 'React · esbuild', layer: 'Frontend', detail: 'Popup and options UI (profiles, voices, settings), bundled with esbuild', tech: ['react', 'esbuild'] },
      { name: 'Node.js + Piper', layer: 'Backend', detail: 'Local server wrapping the Piper voice engine and its downloadable voices', tech: ['node', 'piper'] },
      { name: 'Python + Kokoro', layer: 'Backend', detail: 'Local server running the Kokoro-82M model, for more natural voices', tech: ['python'] },
    ],
    process: [
      'MV3 killed background audio, so playback runs in an offscreen document: one of those Chrome-platform quirks you only learn by hitting it.',
      'Both engines implement one small HTTP API, so the extension picks an engine per profile and falls back to the browser voice when a server is down.',
      'Renamed from Piper TTS once it gained a second engine; settings saved under the old name carry over. Both servers refuse requests from web pages, so only the extension can use them.',
      'Screenshots are generated by a script that runs from WSL but drives Windows Chrome, with mocked servers.',
    ],
    images: [
      { src: '/builds/voicedock/popup.png', alt: 'VoiceDock popup with profile, speed, volume, test, and stop controls' },
      { src: '/builds/voicedock/options-profiles.png', alt: 'VoiceDock options: voice profiles tab' },
      { src: '/builds/voicedock/options-voices.png', alt: 'VoiceDock options: voices tab' },
      { src: '/builds/voicedock/options-settings.png', alt: 'VoiceDock options: settings tab with fallback and shortcuts' },
    ],
    github: 'https://github.com/n8watkins/voicedock',
    repo: 'n8watkins/voicedock',
  },
  {
    slug: 'tldw',
    name: 'TL;DW',
    tagline: 'Short summaries of YouTube videos',
    category: 'Chrome extension',
    tags: ['Chrome', 'Gemini', 'TypeScript'],
    highlights: [
      "Summarises a video from its transcript, right on YouTube",
      'Uses your own free Gemini key, or opens the video in Gemini, ChatGPT, Claude or NotebookLM',
      'Prompt profiles and your own questions shape each summary',
      'Automatic summaries for the channels you pick',
      'Skips sponsor segments with SponsorBlock',
      'No backend, no accounts and no analytics',
    ],
    color: 'from-orange-500/20 to-yellow-600/20',
    problem:
      'A 40-minute video might hold two minutes of answer, and asking an AI means copying the link and retyping the same prompt every time.',
    solution:
      'TL;DW summarizes a YouTube video from its transcript right on the page, with your own free Gemini key, or opens it in Gemini, ChatGPT, Claude or NotebookLM. Prompt profiles shape each summary, and SponsorBlock skips the sponsor reads.',
    stack: [
      { name: 'Chrome MV3 · TypeScript · React', layer: 'Frontend', detail: 'Reads the transcript, renders the summary on YouTube, and the options and history pages', tech: ['chrome', 'typescript', 'react'] },
      { name: 'Vite · CRXJS', layer: 'Frontend', detail: 'Builds the extension with @crxjs/vite-plugin', tech: ['vite'] },
      { name: 'Gemini API', layer: 'Cloud', detail: 'Summaries from Gemini 3.1 Flash-Lite with your own key, kept in Chrome storage', tech: ['gemini'] },
    ],
    process: [
      'Bring your own key: no shared key, no backend, no accounts, analytics or telemetry. The key stays in Chrome storage and goes only to Google.',
      'The full transcript is never stored; history keeps the video and a transcript-free prompt, and summaries are cached for up to seven days.',
      'Every build auto-bumps the patch version and copies to the Windows folder Chrome loads from, so the version in the popup proves a reload picked up the new build.',
    ],
    images: [],
    github: 'https://github.com/n8watkins/tl-dw',
    repo: 'n8watkins/tl-dw',
  },
  {
    slug: 'tubevault',
    name: 'TubeVault',
    tagline: 'Local-first YouTube archiver',
    category: 'Chrome extension',
    tags: ['Chrome', 'yt-dlp', 'React'],
    highlights: [
      'Archive buttons on YouTube watch, Shorts, playlist and channel pages',
      { text: 'Downloads run on your machine with yt-dlp', shot: '/builds/tubevault/tubevault-options-status.png' },
      { text: 'Playlists become a visible per-video queue', shot: '/builds/tubevault/tubevault-popup.png' },
      { text: 'Pick video, audio, metadata and thumbnails', shot: '/builds/tubevault/tubevault-options-downloads.png' },
      { text: 'A Setup tab for the local helper', shot: '/builds/tubevault/tubevault-options-setup.png' },
    ],
    color: 'from-red-500/20 to-rose-600/20',
    problem:
      'Videos go private and channels disappear, and the usual fix is handing your library to a third-party downloader site.',
    solution:
      'TubeVault adds archive buttons to YouTube pages and hands each job to yt-dlp on your own machine. Playlists become a visible queue of per-video downloads, with no remote server involved.',
    stack: [
      { name: 'Chrome MV3 · React · esbuild', layer: 'Frontend', detail: 'Content script UI on YouTube pages, popup queue, and options/history pages', tech: ['chrome', 'react', 'esbuild'] },
      { name: 'Node.js helper', layer: 'Backend', detail: 'Native-messaging host that drives yt-dlp in WSL', tech: ['node'] },
      { name: 'yt-dlp', layer: 'Backend', detail: 'The actual download engine - videos, thumbnails, and metadata', tech: ['ytdlp'] },
      { name: 'PowerShell', layer: 'Backend', detail: 'Installer that registers the native messaging host on Windows', tech: ['powershell'] },
    ],
    process: [
      'The split architecture is the whole trick: the extension never downloads anything itself - it hands jobs across Chrome\'s native-messaging bridge to a local helper, keeping the Web Store surface clean.',
      'Playlist and channel requests expand into per-video jobs, so a 300-video playlist is a queue you can watch drain, not a black box.',
      'A built-in Setup tab walks through the native host install - the part of local-first tools that usually loses people.',
      'Versioned like a real product: changelog, screenshots in the repo, v0.3.x and counting.',
    ],
    images: [
      { src: '/builds/tubevault/tubevault-popup.png', alt: 'TubeVault popup showing active downloads and queued work' },
      { src: '/builds/tubevault/tubevault-options-downloads.png', alt: 'TubeVault options - download history' },
      { src: '/builds/tubevault/tubevault-options-status.png', alt: 'TubeVault options - helper status panel' },
      { src: '/builds/tubevault/tubevault-options-setup.png', alt: 'TubeVault options - setup checklist' },
    ],
    github: 'https://github.com/n8watkins/tube-vault',
    repo: 'n8watkins/tube-vault',
  },
  {
    slug: 'scribe',
    name: 'Scribe',
    tagline: 'Speech-to-text for Windows, Mac and Linux',
    category: 'Desktop app',
    mine: true,
    tags: ['Tauri', 'Rust', 'Whisper'],
    highlights: [
      { text: 'Works in any app: hold Ctrl + Win, talk, let go', shot: '/builds/scribe/app-home.webp' },
      'Text appears while you talk, phrase by phrase',
      { text: '11 Whisper models, on your graphics card or the CPU', shot: '/builds/scribe/app-models-language.webp' },
      { text: 'Search, play back and combine your history', shot: '/builds/scribe/app-history.webp' },
      'Quick notes, a GitHub backup and Markdown, CSV or JSON export',
      { text: 'Seven themes and shortcuts you can change', shot: '/builds/scribe/app-appearance-emerald.webp' },
    ],
    color: 'from-slate-500/20 to-blue-600/20',
    problem:
      'Dictation tools stream your voice to the cloud and charge a subscription, for something you use in every app all day.',
    solution:
      'Hold a hotkey, talk and let go: whisper.cpp transcribes on your PC and the words land at your cursor. History stays in a local database, and no audio leaves the machine.',
    stack: [
      { name: 'Tauri 2 · Rust', layer: 'Backend', detail: 'The desktop app (Windows, with macOS and Linux in beta): tray menu, global hotkeys, audio capture, and text typed at your cursor with your clipboard put back', tech: ['tauri', 'rust'] },
      { name: 'whisper.cpp', layer: 'Backend', detail: 'Speech to text on your PC: a warm server keeps the model loaded, on your graphics card (Vulkan) or the CPU', tech: ['whispercpp'] },
      { name: 'SQLite', layer: 'Backend', detail: 'History, notes and stats, kept for as long as you choose', tech: ['sqlite'] },
      { name: 'React · TypeScript · Vite', layer: 'Frontend', detail: 'The dashboard (history, notes, stats, models, hotkeys, themes), shown in WebView2', tech: ['react', 'typescript', 'vite', 'webview2'] },
      { name: 'GitHub Actions · Releases', layer: 'Cloud', detail: 'Installers built and signed in CI; the app installs signed updates when it starts', tech: ['actions'] },
    ],
    process: [
      'The warm-transcriber design is the speed trick: whisper-server holds the model in memory so transcription starts instantly, with whisper-cli as the fallback path.',
      'Live transcription runs phrase-by-phrase in the background while you talk, so text is ready the moment you release the hotkey.',
      'Windows came first; macOS and Linux followed as betas once people asked, built and smoke-tested in CI on every release.',
      'Privacy is mechanical, not a promise: speech is transcribed on your PC and audio never leaves it. Recordings stay on the PC for playback until their transcript is cleared (or right away, with saving clips turned off), and the only network calls are update checks, the model you choose to download, and the optional GitHub backup and AI tools.',
    ],
    // The app's own screens (captured from its UI by scripts/scribe-tour/), not its landing page (round 4 of 2026-11-02).
    images: [
      { src: '/builds/scribe/app-home.webp', alt: "Scribe's home screen: ready for dictation, today's stats, the last transcript and the main hotkeys" },
      { src: '/builds/scribe/app-history.webp', alt: 'Scribe history: searchable dictations, each with playback, copy and delete' },
      { src: '/builds/scribe/app-models-language.webp', alt: 'Scribe models and language: the active Whisper model, the model catalog, language and GPU acceleration' },
      { src: '/builds/scribe/app-appearance-emerald.webp', alt: 'Scribe appearance: seven color themes, here switched to Emerald' },
    ],
    tryIt: { label: 'Download for Windows', href: '/download/scribe', download: 'scribe' },
    // macOS and Linux builds ship as betas since 2026-11-09 (owner); the Mac app is not notarized.
    moreActions: [
      { label: 'macOS (beta, not notarized)', href: '/download/scribe-mac', quiet: true },
      { label: 'Linux AppImage (beta)', href: '/download/scribe-linux', quiet: true },
    ],
    github: 'https://github.com/n8watkins/scribe',
    liveSite: 'https://scribe.n8builds.dev',
    liveSiteIsLanding: true,
    repo: 'n8watkins/scribe',
    // Scribe publishes a GitHub Release for every version; those tell its story.
    log: 'releases',
  },
  {
    slug: 'openping',
    name: 'OpenPing',
    tagline: 'Uptime monitoring on your own Cloudflare',
    category: 'Web tool',
    tags: ['Cloudflare Workers', 'D1', 'React'],
    highlights: [
      { text: 'HTTP, TCP, DNS, SSL, domain-expiry and heartbeat checks', shot: '/builds/openping/features.webp' },
      { text: "A check run every 12 minutes, on Cloudflare's free plan", shot: '/builds/openping/free-plan.webp' },
      { text: 'Schedule-aware: off-hours never count as downtime', shot: '/builds/openping/schedule-aware.webp' },
      { text: 'Public status pages, an embeddable widget and an SVG badge', shot: '/builds/openping/status.webp' },
      'Alerts to Slack, Teams, Discord, Telegram, email, your phone or a webhook',
      { text: 'Free tools with no sign-up', shot: '/builds/openping/is-it-down.webp' },
    ],
    color: 'from-sky-500/20 to-blue-600/20',
    problem:
      "Uptime monitors are subscriptions that keep your data, and they count an app's planned sleep as downtime.",
    solution:
      "OpenPing runs in your own Cloudflare account on the free plan: a Worker checks your sites every 12 minutes and serves public status pages. Checks follow each app's schedule, so off-hours never cost uptime, and its free tools need no sign-up.",
    stack: [
      { name: 'Cloudflare Workers · Hono · Zod', layer: 'Backend', detail: 'The API, the scheduled checks and the public status feed', tech: ['workers', 'hono', 'zod'] },
      { name: 'Cloudflare D1', layer: 'Cloud', detail: 'Monitors, incidents and uptime history, rolled up from samples to daily and monthly', tech: ['d1'] },
      { name: 'React 19 · Vite · Tailwind v4', layer: 'Frontend', detail: 'The admin app (an installable PWA), status pages and free tools', tech: ['react', 'vite', 'tailwind', 'pwa'] },
      { name: 'Resend · Web Push · Discord', layer: 'Backend', detail: 'Alerts by email, phone notification, Discord or signed webhook', tech: ['resend', 'webpush', 'discord'] },
    ],
    process: [
      'Schedule-aware checking is the idea the rest follows: Render\'s free tier sleeps between visits, so OpenPing keeps the apps awake only when they matter and never counts the off-hours as an outage.',
      'It runs live at openping.n8builds.dev, watching my own sites and apps, with a public status page anyone can check.',
      'Secrets are handled like a product: monitor settings are encrypted with AES-GCM, heartbeat tokens are stored only as hashes, and first-run setup needs a one-time setup token.',
      'It stays inside Cloudflare\'s free plan: one scheduled run every 12 minutes, at most 200 checks per run.',
    ],
images: [
      { src: '/builds/openping/features.webp', alt: 'OpenPing features: HTTP and API, heartbeat and cron, DNS, TCP, domain and SSL checks, and suspended apps' },
      { src: '/builds/openping/free-plan.webp', alt: "What Cloudflare's free plan covers: a check run every 12 minutes, about 24 monitors at once, up to 200 per run" },
      { src: '/builds/openping/schedule-aware.webp', alt: 'Schedule-aware monitoring: an app watched Monday to Friday, 9 to 6, and shown as scheduled off outside those hours' },
      // Recapture once the live status page changes (the services it shows were retired on 2026-11-08).
      { src: '/builds/openping/status.webp', alt: 'A live OpenPing status page: each monitored service with 90 days of uptime bars' },
      { src: '/builds/openping/is-it-down.webp', alt: "OpenPing's free Is it down? tool: n8builds.dev is up, reachable with HTTP 200" },
    ],
    clip: {
      webm: '/builds/openping/clip.webm',
      mp4: '/builds/openping/clip.mp4',
      poster: '/builds/openping/clip-poster.webp',
      alt: 'A short clip of OpenPing in use: a status page with three services, then adding a check for n8builds.dev, which is checked at once, comes up and joins the status page as operational',
      phone: {
        webm: '/builds/openping/clip-phone.webm',
        mp4: '/builds/openping/clip-phone.mp4',
        poster: '/builds/openping/clip-phone-poster.webp',
        alt: 'The same on a phone: OpenPing\'s status page, adding a check for n8builds.dev from the phone layout, and the status page showing it operational',
      },
    },
    // Try it live: the free Is it down? tool, a real check with no sign-up.
    tryLive: 'https://openping.n8builds.dev/tools/is-it-down',
    // The landing page is the product's front door (owner, 2026-11-08).
    tryIt: { label: 'Check it out', href: 'https://openping.n8builds.dev' },
    moreActions: [
      { label: 'Try the free tools', href: 'https://openping.n8builds.dev/tools' },
      // The step-by-step install guide on its site.
      { label: 'Deploy your own', href: 'https://openping.n8builds.dev/install' },
    ],
    github: 'https://github.com/n8watkins/open-ping',
    liveSite: 'https://openping.n8builds.dev',
    liveSiteIsLanding: true,
    repo: 'n8watkins/open-ping',
  },
  {
    slug: 'solara',
    name: 'Solara',
    tagline: 'Know your sun window',
    category: 'Web app',
    tags: ['Next.js', 'Firebase', 'Stripe'],
    highlights: [
      { text: 'Lower-UV windows for each activity, for your skin type and sunscreen', shot: '/builds/solara/app-activity-window.webp' },
      { text: 'Live UV forecasts on a dashboard and a week calendar', shot: '/builds/solara/app-uv-today.webp' },
      { text: 'Try it with no account; sign in free with Google to sync your plan', shot: '/builds/solara/app-skin-type.webp' },
      { text: 'A vitamin D log, kept in your browser', shot: '/builds/solara/app-vitamin-d.webp' },
      { text: 'In English and Spanish, installable on your phone like an app', shot: '/builds/solara/landing-es.webp' },
    ],
    color: 'from-yellow-500/20 to-orange-600/20',
    problem:
      "The UV index is a number, not an answer: whether you can be outside depends on your skin, the activity and how long you'll be out.",
    solution:
      'Solara turns live UV, your skin type and your sunscreen into lower-UV windows for each activity, on a dashboard and a week calendar. Try it with no account, or sign in free to sync your plan.',
    stack: [
      { name: 'Next.js 16 · React 19 · TypeScript', layer: 'Frontend', detail: 'App Router with static export, installable as a PWA', tech: ['nextjs', 'react', 'typescript', 'pwa'] },
      { name: 'Tailwind CSS', layer: 'Frontend', detail: 'Dashboard and onboarding UI', tech: ['tailwind'] },
      { name: 'Open-Meteo', layer: 'Backend', detail: 'Live UV and weather forecasts (free, no API key)', tech: ['openmeteo'] },
      { name: 'Firebase', layer: 'Cloud', detail: 'Google sign-in, Firestore sync, Cloud Messaging push, Hosting, and Functions', tech: ['firebase'] },
      { name: 'Stripe', layer: 'Backend', detail: 'Pro plan billing through Firebase Functions (built, launching with Pro)', tech: ['stripe'] },
      { name: 'Vitest · Playwright · GitHub Actions', layer: 'Cloud', detail: 'Unit and browser tests gate every deploy', tech: ['vitest', 'playwright', 'actions'] },
    ],
    process: [
      'Static export keeps hosting fast and cheap: the windows are computed in the browser against the Open-Meteo API.',
      'Safe windows are computed per activity, skin profile and sunscreen setting, with durations adjustable in preferences.',
      'Free and Pro tiers: Stripe checkout will fulfil Pro through a Firebase Function, so the static site never handles payments.',
      'A planning aid, not medical advice: the app says so up front, because UV and individual sensitivity change quickly.',
    ],
images: [
      { src: '/builds/solara/app-activity-window.webp', alt: "Solara's dashboard in Sydney: the next lower-UV slot for a run, 6pm to 6:45pm, and the day's UV by hour" },
      { src: '/builds/solara/app-uv-today.webp', alt: "Solara's dashboard: today at a glance, live UV by the hour on a sun arc, burn time and a vitamin D estimate" },
      { src: '/builds/solara/app-skin-type.webp', alt: "Solara's setup with no account: choosing a skin type, each with its burn time" },
      { src: '/builds/solara/app-vitamin-d.webp', alt: "Solara's vitamin D log: today's and the last seven days' estimates, and sessions kept in the browser" },
      { src: '/builds/solara/landing-es.webp', alt: "Solara in Spanish: Sabe cuándo salir, with the app's dashboard in Spanish beside it" },
    ],
    clip: {
      webm: '/builds/solara/clip.webm',
      mp4: '/builds/solara/clip.mp4',
      poster: '/builds/solara/clip-poster.webp',
      alt: "A short clip of Solara in use: picking Sydney and a skin type, the day's UV by the hour, then adding a run and getting its lower-UV window",
      phone: {
        webm: '/builds/solara/clip-phone.webm',
        mp4: '/builds/solara/clip-phone.mp4',
        poster: '/builds/solara/clip-phone-poster.webp',
        alt: "The same on a phone: picking Sydney and a skin type, then adding a run and getting its lower-UV window",
      },
    },
    // Try it live: the planner as a guest.
    tryLive: 'https://solara-uv.web.app/app/',
    // Straight into the planner.
    tryIt: { label: 'Find your sun window', href: 'https://solara-uv.web.app/app/' },
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://solara-uv.web.app',
    liveSiteIsLanding: true,
    repo: 'n8watkins/solara',
    // Refactors and internal milestones the filters let through.
    logHide: ['fmtH', 'V1 hardening'],
  },
  {
    slug: 'portfolio-rank',
    name: 'Portfolio Rank',
    // On the developer portfolio since 2026-11-08, not a Lab row.
    homepage: false,
    tagline: 'The developer portfolio leaderboard',
    category: 'Web app',
    tags: ['Next.js', 'TypeScript', 'Open source'],
    highlights: [
      '1,700+ developer portfolios, each with a real screenshot',
      'Head-to-head voting with ELO rankings',
      'One vote per matchup, with GitHub sign-in',
      'Lighthouse scores for every site',
      'Synced daily from the open developer-portfolios list',
    ],
    color: 'from-cyan-500/20 to-blue-600/20',
    problem:
      'Developer portfolios live in long lists sorted A to Z, with no way to find the great ones.',
    solution:
      "Portfolio Rank ranks 1,700+ portfolios from Emma Bostian's open list by head-to-head votes, seeded by AI judging. Each gets a screenshot, Lighthouse scores and an AI review.",
    stack: [
      { name: 'Next.js · React · TypeScript', layer: 'Frontend', detail: 'Face-off voting, leaderboard, and the searchable catalog', tech: ['nextjs', 'react', 'typescript'] },
      { name: 'Tailwind CSS', layer: 'Frontend', detail: 'Browse UI and portfolio cards', tech: ['tailwind'] },
      { name: 'NextAuth (GitHub)', layer: 'Backend', detail: 'Sign-in so each person gets one vote per matchup', tech: ['nextauth'] },
      { name: 'Turso (libSQL)', layer: 'Backend', detail: 'Votes, ELO scores, and the catalog', tech: ['turso'] },
      { name: 'Gemini', layer: 'Backend', detail: 'Pairwise judging to seed the rankings, plus a 6-axis rubric grade per site', tech: ['gemini'] },
      { name: 'Playwright · Cloudflare R2', layer: 'Cloud', detail: 'Screenshots of every portfolio, stored in R2', tech: ['playwright', 'r2'] },
      { name: 'Vercel · GitHub Actions', layer: 'Cloud', detail: 'Hosting, plus daily jobs that sync the list, judge, and refresh', tech: ['vercel', 'actions'] },
    ],
    process: [
      'Open source and community-built - the catalog grows from the same public list it started from.',
      'Rankings start from AI: Gemini judges portfolios head to head so the leaderboard is useful before human votes pile up, then ELO takes over as people vote.',
      'The pipeline runs itself: daily GitHub Actions sync the upstream list, judge new matchups, and refresh screenshots and scores.',
      'Free, with a Ko-fi support link - stars and contributions welcome.',
    ],
    images: [],
    credits: [
      {
        name: 'Emma Bostian, developer-portfolios',
        href: 'https://github.com/emmabostian/developer-portfolios',
        note: 'The community list every portfolio here comes from, curated by Emma and thousands of contributors since 2019. Go star it.',
      },
      {
        name: 'Ali Spittel',
        href: 'https://twitter.com/ASpittel/status/1171604728951779328',
        note: 'Her 2019 tweet asking developers to share their portfolios is what started the list.',
      },
    ],
    cta: {
      heading: 'Vote, or add your portfolio',
      body: 'Pick the better of two portfolios in about five seconds, or add yours: it gets a screenshot, Lighthouse scores and an AI review, and joins the head-to-head rankings.',
      label: 'Add yours on Portfolio Rank',
      // The leaderboard's Browse section, where its "Submit yours" button sits.
      href: 'https://portfoliorank.n8builds.dev/#browse',
    },
    tryIt: { label: 'Vote in a face-off', href: 'https://portfoliorank.n8builds.dev/rank' },
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.n8builds.dev',
    repo: 'n8watkins/portfolio-rank',
  },
  {
    // This site. Every claim here is checked against the repo (tests, CI, headers,
    // Lighthouse runs); refresh the test counts when the suites grow.
    slug: 'n8builds',
    name: 'n8builds.dev',
    tagline: 'This site, tested like a product',
    category: 'Website',
    tags: ['Next.js', 'Playwright', 'Open source'],
    color: 'from-blue-500/20 to-cyan-600/20',
    solution:
      "n8builds.dev holds my builds, the N8's Notions blog and the Loadout, and it is run like a product. Every pull request runs lint, type checks and more than 200 unit tests, then more than 450 Playwright tests across six browser projects in parallel (the APIs, plus Chromium, Firefox, WebKit, a Pixel 7 and an iPhone 14), then Lighthouse budgets on five pages. Branch protection holds every merge until it is green (a docs-only change skips the browser suite), and the source is public.",
    stack: [
      { name: 'Next.js 16 · React 19 · TypeScript', layer: 'Frontend', detail: 'App Router in strict mode; build pages are static, and blog posts revalidate hourly', tech: ['nextjs', 'react', 'typescript'] },
      { name: 'Tailwind CSS 4 · Motion', layer: 'Frontend', detail: 'Theme tokens in CSS, scroll reveals, and reduced motion honored on every animation', tech: ['tailwind'] },
      { name: 'Sanity', layer: 'Backend', detail: "N8's Notions posts, read through the CDN client, so a new post needs no deploy", tech: ['sanity'] },
      { name: 'Vercel · Cloudflare', layer: 'Cloud', detail: 'Auto-deploys from main and an edge rate limit on Vercel; DNS, email routing and Turnstile on Cloudflare', tech: ['vercel', 'cloudflare'] },
      { name: 'Cloudflare D1 · Durable Objects', layer: 'Backend', detail: 'The waitlist and anonymous counts in D1; contact-form rate limits in Durable Objects, shared by every instance and failing closed when unreachable', tech: ['cloudflare'] },
      { name: 'Sentry', layer: 'Cloud', detail: 'Errors and CSP violation reports, through a same-origin tunnel that forwards only this project', tech: ['sentry'] },
      { name: 'Playwright · Vitest', layer: 'Cloud', detail: 'Browser, accessibility (axe), security-header and API tests, plus unit tests, on every pull request', tech: ['playwright', 'vitest'] },
      { name: 'Lighthouse 13', layer: 'Cloud', detail: 'Three runs per page; CI fails if the median misses a performance, accessibility, FCP, LCP or CLS budget', tech: ['lighthouse'] },
    ],
    process: [
      'The nightly Lighthouse run failed the homepage on layout shift (CLS 0.29). Slowing the CPU 6x reproduced it at 0.91: the browser painted the vertically centered hero before the page finished streaming in, and the hero re-centered as it grew. The hero is now top-aligned and its glows mount after hydration, and CLS measures 0.000 at 1x, 4x and 6x slowdown.',
      'Lighthouse budgets run in CI on the home, blog, build log, loadout and Solara pages on desktop, plus a mobile pass on the home, blog and builds pages. Recent desktop runs scored 0.98 to 1.00 for performance and 1.00 for accessibility, best practices and SEO; the homepage report pictured here has a 0.9s LCP and zero layout shift.',
      'An enforced Content-Security-Policy lists every third-party origin, next to X-Frame-Options, nosniff, a strict referrer policy, COOP and a Permissions-Policy that turns off the camera, microphone and location. An E2E test checks the headers on every page and fails on any CSP violation, including a full contact-form submission through Turnstile.',
      'The contact form checks size, content type, a Zod schema, a honeypot and a Turnstile token issued for this hostname, then allows 5 messages an hour per IP and a daily cap for the whole site. A Vercel WAF rule answers floods at the edge. In production, if Turnstile or the rate limits are unreachable, it rejects the message and asks the visitor to email instead.',
      'Every build page and blog post has its own 1200x630 share card, drawn with next/og over the same generated art as the blog covers. An API test walks the sitemap and checks each page for a canonical URL, a unique title and a preview image that loads.',
      'Built with Claude Code as the pair programmer: features are planned in docs in the repo, built in parallel git worktrees, and land as pull requests that branch protection holds until CI is green. This page was one of them.',
    ],
    images: [
      { src: '/builds/n8builds/home-hero-2026-10.webp', alt: 'The n8builds.dev homepage hero at desktop width: the name, the whoami terminal, the prompt, build, ship, repeat chain and the portrait' },
      { src: '/builds/n8builds/lighthouse-2026-10.webp', alt: 'Lighthouse report for the homepage from CI: performance 99, accessibility, best practices and SEO 100, LCP 0.9s, CLS 0' },
      // CI run #169 on main (the #48 merge), retaken 2026-10-26.
      { src: '/builds/n8builds/ci-checks-2026-10.webp', alt: 'A GitHub Actions run on main: lint, types and unit tests, eight E2E jobs, Lighthouse and the CI result, all passing' },
    ],
    github: 'https://github.com/n8watkins/n8builds-web',
    liveSite: 'https://n8builds.dev',
    // The site's own releases (release-kit) and user-facing feat/fix/perf commits.
    repo: 'n8watkins/n8builds-web',
    // CI plumbing and internal history the filters let through: the retired
    // free tools, the split from the old portfolio repo, Sentry config jargon.
    logHide: ['debugging port', 'CanIHost', 'Portfolio 2.0', 'official skill'],
  },
]

/**
 * Builds kept for later but not shown anywhere on the site: no page, no card,
 * no sitemap entry. To bring one back, move it into `builds` above.
 * - VibeLog: paused 2026-10-22 until it's ready to show again.
 */
export const hiddenBuilds: Build[] = [
  // On hold (2026-10-23): the owner is deciding what to do with it; its repo is private.
  {
    slug: 'chrome-extension-kit',
    name: 'Chrome Extension Launch Kit',
    tagline: 'Config-driven Manifest V3 starter',
    category: 'Starter template',
    tags: ['WXT', 'React', 'MV3'],
    color: 'from-blue-500/20 to-cyan-600/20',
    problem:
      'Every new Chrome extension restarts from the same boilerplate: popup and options scaffolding, a settings system, a permissions story, a data inventory, and a release-readiness checklist - rebuilt slightly worse each time.',
    solution:
      'A config-driven Manifest V3 starter built on WXT, React, and TypeScript. Clone it, run setup, and edit one file - extension.config.ts - which controls project metadata, tier, links, permissions, capabilities, data inventory, and developer panels.',
    stack: [
      { name: 'WXT', layer: 'Frontend', detail: 'MV3 build tooling, dev server, and zip packaging' },
      { name: 'React · TypeScript', layer: 'Frontend', detail: 'Structured popup and options pages' },
      { name: 'extension.config.ts', layer: 'Frontend', detail: 'Single config file driving the whole template' },
    ],
    process: [
      'Three deliberate quality tiers - Internal, Public Source, Public Product - so a weekend tool and a Web Store release have different (documented) bars.',
      'V1 is intentionally a template, not a builder: no analytics, no feedback backend, no store automation. Boundaries are written down in the PRD.',
      'A check:extension health command verifies the config and release readiness before shipping.',
      'Born from the patterns repeated across VoiceDock (then Piper TTS), TL;DW, and TubeVault - this kit is those lessons, extracted.',
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
      'One local Node process that tracks git activity, AI token spend, stream time, and channel growth - and serves a live HUD as an OBS browser source, a private dashboard, a public /live page, and shareable /share cards. Local-first, no accounts, $0.',
    stack: [
      { name: 'Node.js · TypeScript', layer: 'Frontend', detail: 'Single local agent process that watches git and session state' },
      { name: 'OBS Browser Source', layer: 'Frontend', detail: 'Transparent 1920×1080 HUD served at localhost:4545/overlay' },
      { name: 'CLI', layer: 'Frontend', detail: 'vibe start / mark / status / report - drive the overlay from a second terminal while coding' },
    ],
    process: [
      'Markers are first-class: "vibe mark feature/bug" annotates the session live, and the end-of-day report is built entirely from the local log - no AI, no network.',
      'A demo mode seeds fake data so the whole overlay can be previewed without a real git repo or session.',
      'Direction lives in a canonical VISION.md; earlier spec docs are kept but explicitly marked historical.',
      'This is the tool behind the "LIVE on VibeLog" badge planned for this site\'s hero.',
    ],
    images: [],
  },
]

export function getBuild(slug: string): Build | undefined {
  return builds.find(b => b.slug === slug)
}
