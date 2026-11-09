// "Stacks I build with" - named combos, not a flat tool list. Each stack is a
// recipe of tools that go together for a kind of project, shown as plain
// chips with their marks, and a short paragraph on the logic of it: why these
// pieces fit together and when I pick it (round 3 of 2026-11-02, in the
// owner's reasons; no per-tool roles or notes). Edit freely.
// Shown on /loadout (components/sections/BuildStacks.tsx, back on 2026-11-02);
// the homepage's Loadout shows the Turso stack as "My default stack".
import type { ReactElement } from 'react'
import Image from 'next/image'
import type { IconType } from 'react-icons'
import { LuAccessibility, LuAudioWaveform, LuKeyRound, LuLaptop, LuMail, LuShieldCheck, LuSparkles, LuTag } from 'react-icons/lu'
import {
  SiCloudflare,
  SiCloudflareworkers,
  SiDrizzle,
  SiEsbuild,
  SiBetterauth,
  SiBrevo,
  SiFirebase,
  SiGithub,
  SiGithubactions,
  SiGooglechrome,
  SiHono,
  SiLucide,
  SiRadixui,
  SiRender,
  SiResend,
  SiSentry,
  SiShadcnui,
  SiStripe,
  SiTailwindcss,
  SiUpstash,
  SiVitest,
  SiZod,
  SiNextdotjs,
  SiReact,
  SiRust,
  SiSqlite,
  SiTauri,
  SiTurso,
  SiTypescript,
  SiVercel,
  SiVite,
} from 'react-icons/si'
import { GgmlMark, PiperMark } from '@/data/stack'

export interface BuildStack {
  name: string
  tagline: string
  /** The tools it is built with, by name (each one's mark is in stackToolIcons). */
  tools: string[]
  /**
   * Where it runs (round 5 of 2026-11-02: hosting is part of the stack, shown
   * explicitly): the hosts, the database and file storage, by name.
   */
  hosting: string[]
  /** Two to four plain sentences: why these pieces fit together, and when I pick it. */
  about: string
  accent: 'cyan' | 'blue' | 'sky' | 'teal' | 'orange'
}

export const buildStacks: BuildStack[] = [
  {
    name: 'The Turso Stack',
    tagline: 'My default for new web apps',
    tools: ['Next.js', 'TypeScript', 'Drizzle'],
    hosting: ['Turso', 'Cloudflare R2', 'Vercel'],
    about:
      "Where a new web app starts. Turso is SQLite at the edge, and its free tier is generous enough that a small project costs nothing while it finds its feet. Drizzle keeps every query typed against the schema, and R2 holds the files. I host on Vercel because it gets new Next.js releases first.",
    accent: 'cyan',
  },
  {
    name: 'The Cloudflare Stack',
    tagline: 'Edge apps and landing pages',
    tools: ['Next.js', 'Hono'],
    hosting: ['Workers', 'D1'],
    // vinext: Cloudflare's reimplementation of the Next.js API on Vite, deployed to Workers (github.com/cloudflare/vinext).
    about:
      'For things that should run on the edge. Cloudflare rebuilt Next.js on Vite as vinext so it runs on Workers, which lets me keep the framework I know and stay on Cloudflare end to end, with Hono for the API and D1 for the data. OpenPing and the landing pages for my upcoming projects live here.',
    accent: 'orange',
  },
  {
    name: 'The Firebase Stack',
    tagline: 'When I want batteries included',
    tools: ['Next.js', 'Firebase Auth'],
    hosting: ['Firestore', 'Vercel'],
    about:
      'For a project that already lives in Google Cloud and uses Google APIs: sign-in and the database come from the same place as everything else it touches. Next.js on Vercel stays the front end. I prefer Firebase here - I avoid\u00a0Supabase.',
    accent: 'blue',
  },
  {
    name: 'The Local-First Stack',
    tagline: 'Desktop apps and local AI',
    tools: ['Tauri', 'Rust', 'SQLite', 'whisper.cpp', 'Piper', 'Kokoro'],
    // A desktop app runs on the user's own PC; Scribe's installer ships as a GitHub release (lib/downloads.ts).
    hosting: ['Your PC', 'GitHub Releases'],
    about:
      'For small desktop apps that should feel native and keep everything on the machine. Tauri and Rust keep them tiny and fast, with SQLite for storage. The speech models run on my own PC too: whisper.cpp for Scribe, Piper and Kokoro for the voices in VoiceDock and T-Hub.',
    accent: 'teal',
  },
  {
    name: 'The Extension Stack',
    tagline: 'Chrome extensions',
    tools: ['Chrome MV3', 'React', 'TypeScript', 'Vite + CRXJS', 'esbuild'],
    hosting: ['Your browser'],
    about:
      'Plain Manifest V3 with no extension framework on top, and React and TypeScript for the UI. Vite with CRXJS builds TL;DW, and esbuild builds VoiceDock and TubeVault.',
    accent: 'sky',
  },
]

/** A brand mark in its own colour. */
const mark = (Icon: IconType, color: string) => <Icon style={{ color }} />
/** Black marks (Next.js, Vercel, Rust) read light on the dark page, as in the AI kit (data/stack.tsx). */
const LIGHT = '#e6edf6'

/**
 * Each stack tool's own mark, in the colours data/stack.tsx gives them (the
 * AI kit's tiles); SQLite's navy is lifted to its logo's light blue so it
 * reads on the dark page. Kokoro has no mark of its own: a sound wave. A tool
 * missing here shows its name alone.
 */
export const stackToolIcons: Record<string, ReactElement> = {
  'Next.js': mark(SiNextdotjs, LIGHT),
  TypeScript: mark(SiTypescript, '#3178c6'),
  Turso: mark(SiTurso, '#4ff8d2'),
  Drizzle: mark(SiDrizzle, '#c5f74f'),
  'Cloudflare R2': mark(SiCloudflare, '#f38020'),
  // Cloudflare's own products, named as they are inside the Cloudflare stack.
  Workers: mark(SiCloudflareworkers, '#f38020'),
  D1: mark(SiCloudflare, '#f38020'),
  Hono: mark(SiHono, '#ff5b11'),
  Vercel: mark(SiVercel, LIGHT),
  'Firebase Auth': mark(SiFirebase, '#ffca28'),
  Firestore: mark(SiFirebase, '#ffca28'),
  Tauri: mark(SiTauri, '#24c8db'),
  Rust: mark(SiRust, LIGHT),
  SQLite: mark(SiSqlite, '#97d9f6'),
  'whisper.cpp': <GgmlMark style={{ color: LIGHT }} />,
  Piper: <PiperMark style={{ color: LIGHT }} />,
  Kokoro: mark(LuAudioWaveform, '#7dd3fc'),
  'Chrome MV3': mark(SiGooglechrome, '#4285f4'),
  React: mark(SiReact, '#61dafb'),
  'Vite + CRXJS': mark(SiVite, '#a78bfa'),
  esbuild: mark(SiEsbuild, '#ffcf00'),
  'Your PC': mark(LuLaptop, '#94a3b8'),
  'GitHub Releases': mark(SiGithub, LIGHT),
  'Your browser': mark(SiGooglechrome, '#4285f4'),
  // The hosts (`hosts`) and the layers across the stacks (`layers`), below.
  Firebase: mark(SiFirebase, '#ffca28'),
  'Cloudflare Workers': mark(SiCloudflareworkers, '#f38020'),
  Render: mark(SiRender, LIGHT),
  Upstash: mark(SiUpstash, '#00e9a3'),
  'GitHub Pages': mark(SiGithub, LIGHT),
  'Tailwind CSS': mark(SiTailwindcss, '#38bdf8'),
  'shadcn/ui': mark(SiShadcnui, LIGHT),
  Radix: mark(SiRadixui, LIGHT),
  // Motion (motion/react) has no mark in Simple Icons: a plain glyph.
  Motion: mark(LuSparkles, '#fde047'),
  Lucide: mark(SiLucide, '#f56565'),
  Zod: mark(SiZod, '#6e9fff'),
  // Auth.js has no mark in Simple Icons: a plain key.
  'Auth.js': mark(LuKeyRound, '#c4b5fd'),
  'Better Auth': mark(SiBetterauth, LIGHT),
  Stripe: mark(SiStripe, '#8b84ff'),
  Nodemailer: mark(LuMail, '#7dd3fc'),
  Brevo: mark(SiBrevo, '#0bc57f'),
  Resend: mark(SiResend, LIGHT),
  Playwright: <Image src="/tech/playwright.svg" alt="" width={16} height={16} unoptimized />,
  axe: mark(LuAccessibility, '#a5b4fc'),
  Vitest: mark(SiVitest, '#a8d14d'),
  Sentry: mark(SiSentry, '#a39ad8'),
  'GitHub Actions': mark(SiGithubactions, '#5b9cf5'),
  'release-kit': mark(LuTag, '#67e8f9'),
  'actionlint, gitleaks, zizmor': mark(LuShieldCheck, '#86efac'),
}

/**
 * Where my projects run (round 5 of 2026-11-02, the owner's ask: hosting is
 * part of the loadout): every host in real use, each with what lives there.
 * Found from the projects' own config (vercel.json, wrangler.jsonc,
 * firebase.json) and their database and cache clients; no
 * Railway (nothing deploys there). See docs/DECISIONS.md, round 5.
 */
export const hosts: { name: string; what: string }[] = [
  { name: 'Vercel', what: 'my portfolio, Portfolio Rank and Scribe’s site' },
  { name: 'Cloudflare Workers', what: 'n8builds.dev (its data in D1), OpenPing, PR Post, Strollz and the upcoming projects’ landing pages' },
  { name: 'Firebase', what: 'Solara: its hosting, functions and Firestore' },
  { name: 'Turso', what: 'SQLite databases, for Portfolio Rank and Net Trailers' },
  { name: 'GitHub Pages', what: 'The Pull Request Post’s editions' },
]

/**
 * The layers every stack shares, beyond its own recipe (round 5 of
 * 2026-11-02): what a builder's loadout usually shows, limited to what my
 * projects really use (their package.json files and workflows).
 */
export const layers: { name: string; tools: string[] }[] = [
  { name: 'UI', tools: ['Tailwind CSS', 'shadcn/ui', 'Radix', 'Motion', 'Lucide'] },
  { name: 'Validation', tools: ['Zod'] },
  { name: 'Sign-in', tools: ['Auth.js', 'Better Auth', 'Firebase Auth'] },
  { name: 'Payments', tools: ['Stripe'] },
  { name: 'Email', tools: ['Nodemailer', 'Brevo', 'Resend'] },
  { name: 'Testing', tools: ['Playwright', 'axe', 'Vitest'] },
  { name: 'Monitoring', tools: ['Sentry'] },
  // The workflow guards are release-kit's CI lanes (and Solara's quality workflow).
  { name: 'CI and releases', tools: ['GitHub Actions', 'release-kit', 'actionlint, gitleaks, zizmor'] },
]
