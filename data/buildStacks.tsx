// "Stacks I build with" - named combos, not a flat tool list. Each stack is a
// recipe of tools that go together for a kind of project. Edit freely.
// Shown on /loadout (components/sections/BuildStacks.tsx, back on 2026-11-02);
// the homepage's Loadout shows the Turso stack as "My default stack".
import type { ReactElement } from 'react'
import type { IconType } from 'react-icons'
import {
  SiCloudflare,
  SiDrizzle,
  SiEsbuild,
  SiFirebase,
  SiNextdotjs,
  SiReact,
  SiRust,
  SiSqlite,
  SiTauri,
  SiTurso,
  SiTypescript,
  SiVercel,
  SiWxt,
} from 'react-icons/si'
import { GgmlMark } from '@/data/stack'

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
    note: 'Auth + realtime without the setup. I prefer Firebase here - I avoid Supabase.',
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

/** A brand mark in its own colour. */
const mark = (Icon: IconType, color: string) => <Icon style={{ color }} />
/** Black marks (Next.js, Vercel, Rust) read light on the dark page, as in the AI kit (data/stack.tsx). */
const LIGHT = '#e6edf6'

/**
 * Each stack tool's own mark, in the colours data/stack.tsx gives them (the
 * AI kit's tiles); SQLite's navy is lifted to its logo's light blue so it
 * reads on the dark page. A tool missing here shows its name alone.
 */
export const stackToolIcons: Record<string, ReactElement> = {
  'Next.js': mark(SiNextdotjs, LIGHT),
  TypeScript: mark(SiTypescript, '#3178c6'),
  Turso: mark(SiTurso, '#4ff8d2'),
  Drizzle: mark(SiDrizzle, '#c5f74f'),
  'Cloudflare R2': mark(SiCloudflare, '#f38020'),
  Vercel: mark(SiVercel, LIGHT),
  'Firebase Auth': mark(SiFirebase, '#ffca28'),
  Firestore: mark(SiFirebase, '#ffca28'),
  Tauri: mark(SiTauri, '#24c8db'),
  Rust: mark(SiRust, LIGHT),
  SQLite: mark(SiSqlite, '#97d9f6'),
  'whisper.cpp': <GgmlMark style={{ color: LIGHT }} />,
  WXT: mark(SiWxt, '#67d55e'),
  React: mark(SiReact, '#61dafb'),
  esbuild: mark(SiEsbuild, '#ffcf00'),
}
