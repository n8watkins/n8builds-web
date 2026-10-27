import type { CSSProperties, ReactElement } from 'react'
import { SiClaude, SiCursor, SiGooglegemini, SiHuggingface } from 'react-icons/si'
// Simple Icons dropped the OpenAI mark (react-icons 5.7); Bootstrap Icons has it.
import { BsOpenai } from 'react-icons/bs'

export interface AIStackItem {
  name: string
  icon: ReactElement
  description: string
}

const ICON = 'w-7 h-7'

interface MarkProps {
  className?: string
  style?: CSSProperties
}

/**
 * whisper.cpp has no icon of its own (its README banner is a wordmark), so the
 * tile uses the mark of ggml-org, the project that makes it: the pixel "GG"
 * badge from its GitHub avatar, the letters cut out of the badge.
 */
export function GgmlMark({ className, style }: MarkProps) {
  const holes = [
    // First G
    [13, 14, 11, 3],
    [13, 17, 2, 11],
    [13, 28, 11, 2],
    [21, 17, 3, 4],
    [21, 22, 3, 6],
    [18, 22, 3, 3],
    // Second G
    [26, 19, 11, 3],
    [26, 22, 3, 11],
    [26, 33, 11, 3],
    [34, 22, 3, 4],
    [34, 28, 3, 5],
    [32, 28, 2, 2],
  ]
  const badge = 'M10 10h30v3h2v24h-2v3H10v-3H7V13h3z'
  const d = badge + holes.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h-${w}z`).join('')
  return (
    <svg viewBox="7 10 35 30" aria-hidden="true" className={className} style={style}>
      <path d={d} fill="currentColor" fillRule="evenodd" shapeRendering="crispEdges" />
    </svg>
  )
}

/**
 * Piper's mark (from its README logo): the "P" of PIPER wearing a jester's
 * cap, its three points tipped with bells.
 */
function PiperMark({ className, style }: MarkProps) {
  return (
    <svg viewBox="0 0 48 52" aria-hidden="true" className={className} style={style}>
      <g fill="currentColor">
        {/* The P, its top-left corner cut on the slant of the cap's brim. */}
        <path
          fillRule="evenodd"
          d="M17 29 32 20h2c6.5 0 11 4.5 11 10.5S40.5 41 34 41h-9v10h-8zm8-1v6h8c2 0 3.5-1.3 3.5-3S35 28 33 28z"
        />
        {/* The cap: three points over a brim that dips into the P's corner. */}
        <path d="M3.5 22.5C6 17 9 15.5 12 15c0-5 .5-8.5 2-12 2.5 4 4.5 7.5 6.5 10 2.5-3.5 5.5-6 10-7.5-1.5 3.5-1 7.5.5 11.5L16 26l-5-5c-3-.5-5.5 0-7.5 1.5z" />
        <circle cx="14" cy="2.8" r="2.6" />
        <circle cx="31" cy="5.2" r="2.6" />
        <circle cx="3.2" cy="23" r="2.6" />
      </g>
    </svg>
  )
}

// Colours: the brands' own, lifted where a dark mark would vanish on the dark
// tiles (Cursor, OpenAI and ggml are black-and-white marks: light here).
const LIGHT = '#e6edf6'

// Row 1 - agents & models (the heavy lifters)
export const ai_agents: AIStackItem[] = [
  { name: 'Claude Code', icon: <SiClaude className={ICON} style={{ color: '#D97757' }} />, description: 'My pair-programmer - I build most things here now.' },
  { name: 'Cursor', icon: <SiCursor className={ICON} style={{ color: LIGHT }} />, description: 'Inline, context-aware edits when my hands are on the keys.' },
  { name: 'OpenAI', icon: <BsOpenai className={ICON} style={{ color: LIGHT }} />, description: 'Generation pipelines and structured outputs.' },
  { name: 'Gemini', icon: <SiGooglegemini className={ICON} style={{ color: '#4285F4' }} />, description: 'Long-context summarization in my extensions.' },
]

// Row 2 - local-first & tooling (whisper.cpp powers Scribe, Piper powers the Piper TTS extension)
export const ai_tools: AIStackItem[] = [
  { name: 'whisper.cpp', icon: <GgmlMark className={ICON} style={{ color: LIGHT }} />, description: 'Local speech-to-text (powers Scribe).' },
  { name: 'Piper', icon: <PiperMark className={ICON} style={{ color: LIGHT }} />, description: 'Local text-to-speech (powers my Piper TTS extension).' },
  { name: 'Hugging Face', icon: <SiHuggingface className={ICON} style={{ color: '#FFD21E' }} />, description: 'Models and datasets to pull from.' },
]
