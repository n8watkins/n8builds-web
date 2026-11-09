// "Stacks I build with" - named combos, not a flat tool list. Each stack is a
// recipe of tools that go together for a kind of project, shown as plain
// chips with their marks: its name, what it is for, the tools and where it
// runs (round 8 of 2026-11-09: no paragraph under each stack).
// Shown on /loadout (components/sections/BuildStacks.tsx); the homepage's
// Loadout shows the first two, the Quick stack and the Production stack, as
// "My tech stacks".
//
// Round 9 (owner, 2026-11-09): the homepage calls them "My tech stacks"; the
// Quick stack lists what the quick apps really use (no Firebase Auth), and the
// Production stack reads as the Cloudflare stack it is, each service with
// what it does.
//
// Round 8 (owner, 2026-11-09): two defaults instead of the Turso, Cloudflare
// and Firebase stacks. The owner hardly uses Vercel now, and wants no Turso
// stack (Supabase is acquiring Turso, announced 2026-10-02, and he avoids
// Supabase). The Quick stack gets something up fast on Vercel, with Firebase
// for sign-in and data (one console, a free plan, no schema or migrations; what
// Solara runs on). The Production stack is what his live apps run on: Next.js
// on Cloudflare Workers through OpenNext, D1, R2, Durable Objects, Images and
// Email Service (n8builds.dev, the portfolio, Portfolio Rank, OpenPing, Pivot
// and Feelium's wrangler configs).
import type { ReactElement } from 'react'
import Image from 'next/image'
import type { IconType } from 'react-icons'
import {
  LuAccessibility,
  LuArchive,
  LuAudioWaveform,
  LuBox,
  LuDatabase,
  LuImage,
  LuKeyRound,
  LuLaptop,
  LuLayers,
  LuMail,
  LuShieldCheck,
  LuSparkles,
  LuTag,
} from 'react-icons/lu'
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
  /** Its id, for its card's heading. */
  id: string
  name: string
  tagline: string
  /** The tools it is built with, by name (each one's mark is in stackToolIcons). */
  tools: string[]
  /**
   * Where it runs (round 5 of 2026-11-02: hosting is part of the stack, shown
   * explicitly): the hosts, the database and file storage, by name.
   */
  hosting: string[]
  /**
   * A stack that runs on one provider's products (the Production stack, all
   * Cloudflare): each service by name with what it does there, in plain
   * words, for the homepage's "My tech stacks" (round 9 of 2026-11-09).
   */
  services?: { provider: string; summary: string; items: { name: string; purpose: string }[] }
  accent: 'cyan' | 'blue' | 'sky' | 'teal' | 'orange'
}

export const buildStacks: BuildStack[] = [
  {
    id: 'quick',
    name: 'Quick stack',
    tagline: 'Get something up fast',
    // What the quick apps really use (round 9 of 2026-11-09, from their repos: Pivot, Feelium,
    // Portfolio Rank and Net Trailers): Auth.js with GitHub sign-in and a Turso database, on
    // Vercel. No Firebase Auth (the owner doesn't use it here).
    tools: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Auth.js'],
    hosting: ['Vercel', 'Turso'],
    accent: 'blue',
  },
  {
    id: 'production',
    name: 'Production stack',
    tagline: 'What my live apps run on',
    tools: ['Next.js', 'TypeScript', 'OpenNext', 'Hono'],
    hosting: ['Workers', 'D1', 'R2', 'Durable Objects', 'Images', 'Email Service'],
    // Every service is Cloudflare's (round 9 of 2026-11-09), from the wrangler configs of
    // n8builds.dev, Wren, OpenPing and Portfolio Rank. The email is Cloudflare Email Service
    // (the send_email binding, in n8builds.dev and Wren); OpenPing's alerts go through Resend.
    services: {
      provider: 'Cloudflare',
      // Round 10 of 2026-11-09 (owner): the card reads as "Cloudflare", everything on it,
      // Next.js included; no line about the code under the services.
      summary: 'everything runs here, Next.js included',
      items: [
        { name: 'Workers', purpose: 'runs Next.js, through OpenNext' },
        { name: 'D1', purpose: 'the database (SQLite)' },
        { name: 'R2', purpose: 'stores files and the page cache' },
        { name: 'Durable Objects', purpose: 'per-user state and live counters' },
        { name: 'Images', purpose: 'resizes images' },
        { name: 'Email Service', purpose: 'sends the email' },
      ],
    },
    accent: 'orange',
  },
  {
    id: 'local-first',
    name: 'Local-first stack',
    tagline: 'Desktop apps and local AI',
    tools: ['Tauri', 'Rust', 'SQLite', 'whisper.cpp', 'Piper', 'Kokoro'],
    // A desktop app runs on the user's own PC; Scribe's installer ships as a GitHub release (lib/downloads.ts).
    hosting: ['Your PC', 'GitHub Releases'],
    accent: 'teal',
  },
  {
    id: 'extension',
    name: 'Extension stack',
    tagline: 'Chrome extensions',
    tools: ['Chrome MV3', 'React', 'TypeScript', 'Vite + CRXJS', 'esbuild'],
    hosting: ['Your browser'],
    accent: 'sky',
  },
]

/**
 * What each piece of the two default stacks is doing there, in a few words:
 * the homepage's "My default stacks" shows it beside the tool.
 */
export const stackRoles: Record<string, string> = {
  'Next.js': 'the framework',
  TypeScript: 'strict, everywhere',
  'Tailwind CSS': 'styling',
  'Auth.js': 'GitHub sign-in',
  Vercel: 'a push ships it',
  Turso: 'SQLite database',
  OpenNext: 'Next.js on Workers',
  Hono: 'small APIs',
  Workers: 'hosting, at the edge',
  D1: 'SQLite database',
  R2: 'files and cache',
  'Durable Objects': 'counters and queues',
  Images: 'resizing',
  'Email Service': 'sending email',
}

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
  // Cloudflare's own products, named as they are inside the Production stack, each with
  // its own glyph in Cloudflare's orange (Simple Icons has a mark for Workers only).
  Workers: mark(SiCloudflareworkers, '#f38020'),
  D1: mark(LuDatabase, '#f38020'),
  R2: mark(LuArchive, '#f38020'),
  'Durable Objects': mark(LuBox, '#f38020'),
  Images: mark(LuImage, '#f38020'),
  'Email Service': mark(LuMail, '#f38020'),
  // OpenNext has no mark in Simple Icons: a plain glyph for the adapter layer.
  OpenNext: mark(LuLayers, '#e6edf6'),
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
 * part of the loadout; brought up to date in round 8 of 2026-11-09): every
 * host in real use, each with what lives there.
 * Found from the projects' own config (vercel.json, wrangler.jsonc,
 * firebase.json) and their database and cache clients; no
 * Railway (nothing deploys there). See docs/DECISIONS.md, round 5.
 */
export const hosts: { name: string; what: string }[] = [
  // Everything that was on Vercel moved to Workers by 2026-11-09 (each site answers from
  // Cloudflare, the Next.js ones through OpenNext): Vercel is the Quick stack's host only.
  { name: 'Cloudflare Workers', what: 'n8builds.dev (its data in D1), my portfolio, Portfolio Rank, OpenPing, PR Post, Scribe’s site and the upcoming projects’ landing pages' },
  { name: 'Firebase', what: 'Solara: its hosting, functions and Firestore' },
  { name: 'Turso', what: 'SQLite databases, for Portfolio Rank, Net Trailers and a few upcoming apps' },
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
