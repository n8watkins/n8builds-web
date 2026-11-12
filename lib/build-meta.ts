import type { Build } from '@/data/builds'

// What the build log shows beside each build: its app icon (the same files the
// Lab rows and the extensions use) and the kind it is filed under, for the
// /builds filter.

/** The builds' own app icons, by slug. */
export const BUILD_ICONS: Record<string, string> = {
  voicedock: '/builds/voicedock/icon.svg',
  tldw: '/builds/tldw/icon.svg',
  tubevault: '/builds/tubevault/icon.svg',
  scribe: '/builds/scribe/app-icon.png',
  openping: '/builds/openping/icon.svg',
  solara: '/builds/solara/icon.png',
  'portfolio-rank': '/builds/portfolio-rank/icon.png',
  n8builds: '/tab/n8-icon-192.png',
  // The developer portfolio's mark, a briefcase in its teal, as on its template card.
  portfolio: '/builds/portfolio/icon.svg',
  // Projects without a build page (data/logBuilds.ts): the upcoming projects'
  // own marks, and my tools' tiles (scripts/gen-tool-tiles.mjs).
  feelium: '/upcoming/feelium.svg',
  cutelyaskme: '/upcoming/cutelyaskme.svg',
  fitflow7: '/upcoming/fitflow7.svg',
  pivot: '/upcoming/pivot.svg',
  whoami: '/upcoming/whoami.svg',
  'release-kit': '/log/release-kit.svg',
  'pass-env': '/log/pass-env.svg',
  devguard: '/log/devguard.svg',
  'pr-post': '/log/pr-post.svg',
}

export type LogKind = 'tools' | 'apps' | 'extensions' | 'site' | 'upcoming'

/** The kinds in filter order, with their chip labels. */
export const LOG_KINDS: { id: LogKind; label: string }[] = [
  { id: 'tools', label: 'Tools' },
  { id: 'apps', label: 'Web apps' },
  { id: 'extensions', label: 'Chrome extensions' },
  { id: 'site', label: 'This site' },
  { id: 'upcoming', label: 'Upcoming' },
]

/**
 * The kind a build is filed under: the owner's daily drivers and the desktop
 * and web tools are Tools, extensions (and the extension starter) are Chrome
 * extensions, n8builds.dev itself is This site, the upcoming projects are
 * Upcoming, and every other web app is a Web app.
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
    case 'Dev tool':
      return 'tools'
    case 'Upcoming':
      return 'upcoming'
    case 'Website':
      return 'site'
    default:
      return 'apps'
  }
}
