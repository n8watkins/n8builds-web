import { ReactElement } from 'react'
import {
  SiClaude,
  SiOpenai,
  SiGooglegemini,
  SiOllama,
  SiHuggingface,
  SiLangchain,
  SiPerplexity,
} from 'react-icons/si'
import { FiEdit3, FiMic, FiVolume2 } from 'react-icons/fi'

export interface AIStackItem {
  name: string
  icon: ReactElement
  description: string
}

const ICON = 'w-7 h-7'

// Row 1 — agents & models (the heavy lifters)
export const ai_agents: AIStackItem[] = [
  { name: 'Claude Code', icon: <SiClaude className={ICON} style={{ color: '#D97757' }} />, description: 'My pair-programmer — I build most things here now.' },
  { name: 'Cursor', icon: <FiEdit3 className={ICON} style={{ color: '#38bdf8' }} />, description: 'Inline, context-aware edits when my hands are on the keys.' },
  { name: 'OpenAI', icon: <SiOpenai className={ICON} style={{ color: '#10A37F' }} />, description: 'Generation pipelines and structured outputs.' },
  { name: 'Gemini', icon: <SiGooglegemini className={ICON} style={{ color: '#4285F4' }} />, description: 'Long-context summarization in my extensions.' },
  { name: 'Perplexity', icon: <SiPerplexity className={ICON} style={{ color: '#20B8CD' }} />, description: 'Fast research with sources.' },
]

// Row 2 — local-first & tooling
export const ai_tools: AIStackItem[] = [
  { name: 'Ollama', icon: <SiOllama className={ICON} style={{ color: '#e5e7eb' }} />, description: 'Runs local models on my own machine.' },
  { name: 'whisper.cpp', icon: <FiMic className={ICON} style={{ color: '#22d3ee' }} />, description: 'Local speech-to-text (powers Scribe).' },
  { name: 'Piper', icon: <FiVolume2 className={ICON} style={{ color: '#2dd4bf' }} />, description: 'Local text-to-speech, no cloud.' },
  { name: 'Hugging Face', icon: <SiHuggingface className={ICON} style={{ color: '#FFD21E' }} />, description: 'Models and datasets to pull from.' },
  { name: 'LangChain', icon: <SiLangchain className={ICON} style={{ color: '#5eead4' }} />, description: 'Glue for the occasional agent pipeline.' },
]
