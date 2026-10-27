import type { Build } from '@/data/builds'

// What the build log shows beside each build: its app icon (the same files the
// Lab rows and the extensions use) and the kind it is filed under, for the
// /builds filter.

/** The builds' own app icons, by slug. */
export const BUILD_ICONS: Record<string, string> = {
  'piper-tts': '/builds/piper-tts/icon.png',
  tldw: '/builds/tldw/icon.png',
  tubevault: '/builds/tubevault/icon.png',
  scribe: '/builds/scribe/app-icon.png',
  openping: '/builds/openping/icon.svg',
  solara: '/builds/solara/icon.png',
  'portfolio-rank': '/builds/portfolio-rank/icon.png',
  n8builds: '/tab/n8-icon-192.png',
}

export type LogKind = 'tools' | 'apps' | 'extensions' | 'site'

/** The kinds in filter order, with their chip labels. */
export const LOG_KINDS: { id: LogKind; label: string }[] = [
  { id: 'tools', label: 'Tools' },
  { id: 'apps', label: 'Web apps' },
  { id: 'extensions', label: 'Chrome extensions' },
  { id: 'site', label: 'This site' },
]

/**
 * The kind a build is filed under: the owner's daily tools and the desktop and
 * web tools are Tools, extensions (and the extension starter) are Chrome
 * extensions, n8builds.dev itself is This site, and every other web app is a
 * Web app. Mirrors the Lab's shelves (data/shelves.ts).
 */
export function logKind(build: Pick<Build, 'category' | 'mine'>): LogKind {
  if (build.mine) return 'tools'
  switch (build.category) {
    case 'Chrome extension':
    case 'Starter template':
      return 'extensions'
    case 'Desktop app':
    case 'Streaming tool':
    case 'GitHub Actions bot':
    case 'Web tool':
      return 'tools'
    case 'Website':
      return 'site'
    default:
      return 'apps'
  }
}
