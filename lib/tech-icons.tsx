import type { IconType } from 'react-icons'
import {
  SiCloudflare,
  SiCloudflareworkers,
  SiDiscord,
  SiEsbuild,
  SiFirebase,
  SiGithubactions,
  SiGooglecalendar,
  SiGooglechrome,
  SiGooglegemini,
  SiHono,
  SiLighthouse,
  SiNextdotjs,
  SiNodedotjs,
  SiPuppeteer,
  SiPwa,
  SiReact,
  SiResend,
  SiRust,
  SiSanity,
  SiSentry,
  SiSqlite,
  SiStripe,
  SiTailwindcss,
  SiTauri,
  SiTurso,
  SiTypescript,
  SiUpstash,
  SiVercel,
  SiVite,
  SiVitest,
  SiYoutube,
  SiZod,
} from 'react-icons/si'
import { VscTerminalPowershell } from 'react-icons/vsc'
import { LuAppWindow, LuAudioLines, LuBellRing, LuDatabase } from 'react-icons/lu'

/**
 * The technologies a build page names, each with its real mark: a Simple
 * Icons glyph in the brand's colour, or the project's own logo (public/tech,
 * public/projectIcons) where Simple Icons has none. Build pages show these on
 * their tech pills and Stack cards (data/builds.tsx `tech`).
 */
export type TechMark = { label: string; color: string } & ({ Icon: IconType } | { src: string })

export const TECH = {
  tauri: { label: 'Tauri', Icon: SiTauri, color: '#FFC131' },
  rust: { label: 'Rust', Icon: SiRust, color: '#F46623' },
  react: { label: 'React', Icon: SiReact, color: '#61DAFB' },
  typescript: { label: 'TypeScript', Icon: SiTypescript, color: '#3178C6' },
  vite: { label: 'Vite', Icon: SiVite, color: '#A78BFA' },
  nextjs: { label: 'Next.js', Icon: SiNextdotjs, color: '#F8FAFC' },
  tailwind: { label: 'Tailwind CSS', Icon: SiTailwindcss, color: '#38BDF8' },
  sqlite: { label: 'SQLite', Icon: SiSqlite, color: '#5EA7D8' },
  whispercpp: { label: 'whisper.cpp', src: '/tech/ggml.png', color: '#F8FAFC' },
  webview2: { label: 'WebView2', Icon: LuAppWindow, color: '#38BDF8' },
  cloudflare: { label: 'Cloudflare', Icon: SiCloudflare, color: '#F38020' },
  workers: { label: 'Cloudflare Workers', Icon: SiCloudflareworkers, color: '#F38020' },
  d1: { label: 'Cloudflare D1', Icon: LuDatabase, color: '#F38020' },
  hono: { label: 'Hono', Icon: SiHono, color: '#FF5B11' },
  zod: { label: 'Zod', Icon: SiZod, color: '#5B8DEF' },
  resend: { label: 'Resend', Icon: SiResend, color: '#F8FAFC' },
  webpush: { label: 'Web Push', Icon: LuBellRing, color: '#A3E635' },
  discord: { label: 'Discord', Icon: SiDiscord, color: '#7C8CF8' },
  firebase: { label: 'Firebase', Icon: SiFirebase, color: '#FFCA28' },
  stripe: { label: 'Stripe', Icon: SiStripe, color: '#8B87FF' },
  openmeteo: { label: 'Open-Meteo', src: '/projectIcons/open-meteo.png', color: '#FF8800' },
  gcal: { label: 'Google Calendar', Icon: SiGooglecalendar, color: '#60A5FA' },
  pwa: { label: 'PWA', Icon: SiPwa, color: '#A78BFA' },
  vercel: { label: 'Vercel', Icon: SiVercel, color: '#F8FAFC' },
  actions: { label: 'GitHub Actions', Icon: SiGithubactions, color: '#60A5FA' },
  playwright: { label: 'Playwright', src: '/tech/playwright.svg', color: '#45BA4B' },
  vitest: { label: 'Vitest', Icon: SiVitest, color: '#84CC16' },
  chrome: { label: 'Chrome', Icon: SiGooglechrome, color: '#60A5FA' },
  node: { label: 'Node.js', Icon: SiNodedotjs, color: '#5FA04E' },
  esbuild: { label: 'esbuild', Icon: SiEsbuild, color: '#FFCF00' },
  piper: { label: 'Piper', Icon: LuAudioLines, color: '#34D399' },
  ytdlp: { label: 'yt-dlp', Icon: SiYoutube, color: '#F87171' },
  powershell: { label: 'PowerShell', Icon: VscTerminalPowershell, color: '#60A5FA' },
  puppeteer: { label: 'Puppeteer', Icon: SiPuppeteer, color: '#40B5A4' },
  turso: { label: 'Turso', Icon: SiTurso, color: '#4FF8D2' },
  gemini: { label: 'Gemini', Icon: SiGooglegemini, color: '#8AB4F8' },
  nextauth: { label: 'NextAuth', src: '/projectIcons/nextAuth.png', color: '#A78BFA' },
  r2: { label: 'Cloudflare R2', Icon: SiCloudflare, color: '#F38020' },
  sanity: { label: 'Sanity', Icon: SiSanity, color: '#F36458' },
  sentry: { label: 'Sentry', Icon: SiSentry, color: '#A78BFA' },
  upstash: { label: 'Upstash', Icon: SiUpstash, color: '#00E9A3' },
  lighthouse: { label: 'Lighthouse', Icon: SiLighthouse, color: '#F44B21' },
} satisfies Record<string, TechMark>

export type TechKey = keyof typeof TECH

/** A technology's mark at a given size: the glyph in its colour, or its logo. */
export function TechGlyph({ tech, className = 'h-4 w-4' }: { tech: TechKey; className?: string }) {
  const mark: TechMark = TECH[tech]
  if ('Icon' in mark) {
    const { Icon } = mark
    return <Icon aria-hidden className={`shrink-0 ${className}`} style={{ color: mark.color }} />
  }
  // eslint-disable-next-line @next/next/no-img-element -- a tiny static logo; next/image adds nothing here
  return <img src={mark.src} alt="" aria-hidden className={`shrink-0 rounded-[3px] object-contain ${className}`} />
}
