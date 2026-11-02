// "Stacks I build with" - named combos, not a flat tool list. Each stack is a
// recipe of tools that go together for a kind of project, each tool with its
// role in it, and one short line on why the stack (the owner's reasons,
// 2026-11-02). Edit freely.
// Shown on /loadout (components/sections/BuildStacks.tsx, back on 2026-11-02);
// the homepage's Loadout shows the Turso stack as "My default stack".
import type { ReactElement } from 'react'
import type { IconType } from 'react-icons'
import { LuAudioWaveform } from 'react-icons/lu'
import {
  SiCloudflare,
  SiCloudflareworkers,
  SiDrizzle,
  SiEsbuild,
  SiFirebase,
  SiGooglechrome,
  SiHono,
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

/** A tool in a stack, with the job it does there ("Database", "Hosting"). */
export interface StackTool {
  name: string
  role: string
}

export interface BuildStack {
  name: string
  tagline: string
  tools: StackTool[]
  /** One short line on why this stack. */
  note: string
  accent: 'cyan' | 'blue' | 'sky' | 'teal' | 'orange'
}

export const buildStacks: BuildStack[] = [
  {
    name: 'The Turso Stack',
    tagline: 'My default for new web apps',
    tools: [
      { name: 'Next.js', role: 'Framework' },
      { name: 'TypeScript', role: 'Language' },
      { name: 'Turso', role: 'Database' },
      { name: 'Drizzle', role: 'ORM' },
      { name: 'Cloudflare R2', role: 'Files' },
      { name: 'Vercel', role: 'Hosting' },
    ],
    note: "Turso's free tier is generous, and Vercel gets new Next.js releases first.",
    accent: 'cyan',
  },
  {
    name: 'The Cloudflare Stack',
    tagline: 'Edge apps and landing pages',
    tools: [
      { name: 'Next.js', role: 'Framework' },
      { name: 'Hono', role: 'API' },
      { name: 'Workers', role: 'Hosting' },
      { name: 'D1', role: 'Database' },
    ],
    // vinext: Cloudflare's reimplementation of the Next.js API on Vite, deployed to Workers (github.com/cloudflare/vinext).
    note: 'Cloudflare rebuilt Next.js on Vite as vinext, to run on its Workers. OpenPing and my landing pages live there.',
    accent: 'orange',
  },
  {
    name: 'The Firebase Stack',
    tagline: 'When I want batteries included',
    tools: [
      { name: 'Next.js', role: 'Framework' },
      { name: 'Firebase Auth', role: 'Sign-in' },
      { name: 'Firestore', role: 'Database' },
      { name: 'Vercel', role: 'Hosting' },
    ],
    note: 'Fits projects already in Google Cloud that use Google APIs. I prefer Firebase here - I avoid Supabase.',
    accent: 'blue',
  },
  {
    name: 'The Local-First Stack',
    tagline: 'Desktop apps and local AI',
    tools: [
      { name: 'Tauri', role: 'App shell' },
      { name: 'Rust', role: 'Language' },
      { name: 'SQLite', role: 'Database' },
      { name: 'whisper.cpp', role: 'Speech' },
      { name: 'Piper', role: 'Voices' },
      { name: 'Kokoro', role: 'Voices' },
    ],
    note: 'Tiny apps, native speed, and the speech models run on my own PC (Scribe, VoiceDock).',
    accent: 'teal',
  },
  {
    name: 'The Extension Stack',
    tagline: 'Chrome extensions',
    tools: [
      { name: 'Chrome MV3', role: 'Platform' },
      { name: 'React', role: 'UI' },
      { name: 'TypeScript', role: 'Language' },
      { name: 'Vite + CRXJS', role: 'Build' },
      { name: 'esbuild', role: 'Build' },
    ],
    note: 'Plain Manifest V3 with React: Vite and CRXJS for TL;DW, esbuild for VoiceDock and TubeVault.',
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
}
