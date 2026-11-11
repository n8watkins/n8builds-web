import { usesFixtures } from '@/lib/fixtures'

/**
 * Stable download links for builds that ship installers: n8builds.dev/download/<app>
 * always points at the newest release's file, though its name carries the
 * version (Scribe_0.8.0_x64-setup.exe).
 */

export interface Download {
  /** The GitHub repo (`owner/name`) whose latest release holds the file. */
  repo: string
  /** Picks the file among the release's assets. */
  asset: RegExp
}

export const DOWNLOADS: Record<string, Download> = {
  // The NSIS installer: the smaller of Scribe's two Windows installers, and the one its site offers.
  scribe: { repo: 'n8watkins/scribe', asset: /_x64-setup\.exe$/ },
  // macOS and Linux, in beta since 2026-11-09, matched by their file type so a
  // renamed file still matches: one universal .dmg, an AppImage, and a .deb.
  'scribe-mac': { repo: 'n8watkins/scribe', asset: /\.dmg$/i },
  'scribe-linux': { repo: 'n8watkins/scribe', asset: /\.AppImage$/i },
  'scribe-deb': { repo: 'n8watkins/scribe', asset: /\.deb$/i },
}

/** A desktop OS a build ships for. */
export type DesktopOs = 'windows' | 'mac' | 'linux'

/** One OS's download of a desktop app, as its download button and the line under it show it. */
export interface PlatformDownload {
  /** Its stable link, n8builds.dev/download/<app>. */
  href: string
  /** What it runs on, then the release and size when GitHub can say: "Windows 10 and 11, 64-bit · v0.8.0 · 12 MB". */
  facts: string
  /** A build still in beta (Scribe's Mac and Linux builds). */
  beta: boolean
  /** A sentence after the facts: the first-run step a Mac needs. */
  note?: string
  /** A second file for the same OS (Linux's .deb beside the AppImage). */
  alt?: { href: string; label: string }
}

/** Scribe's downloads per OS (owner, 2026-11-09: Windows, and macOS and Linux in beta). */
const SCRIBE: Record<DesktopOs, { app: string; runsOn: string; beta: boolean; note?: string; alt?: { app: string; label: string } }> = {
  // Windows 10 and 11, 64-bit only (Scribe's README).
  windows: { app: 'scribe', runsOn: 'Windows 10 and 11, 64-bit', beta: false },
  mac: {
    app: 'scribe-mac',
    runsOn: 'macOS, Apple silicon and Intel',
    beta: true,
    note: 'Not notarized by Apple: open it once, then allow it in System Settings > Privacy & Security > Open Anyway.',
  },
  linux: { app: 'scribe-linux', runsOn: 'Linux, 64-bit AppImage', beta: true, alt: { app: 'scribe-deb', label: '.deb' } },
}

/** Scribe's download for each OS, with the newest release's version and size where GitHub can say. */
export async function scribeDownloads(): Promise<Record<DesktopOs, PlatformDownload>> {
  const entries = await Promise.all(
    (Object.keys(SCRIBE) as DesktopOs[]).map(async (os) => {
      const { app, runsOn, beta, note, alt } = SCRIBE[os]
      const asset = await latestAsset(DOWNLOADS[app])
      const facts = [runsOn, ...(asset ? [asset.version, formatSize(asset.size)] : [])].join(' · ')
      return [os, { href: `/download/${app}`, facts, beta, note, alt: alt && { href: `/download/${alt.app}`, label: alt.label } }] as const
    }),
  )
  return Object.fromEntries(entries) as Record<DesktopOs, PlatformDownload>
}

interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string; size: number }[]
}

// The E2E suite's release (BUILD_LOG_FIXTURE=1), so the tests never call GitHub.
const FIXTURE: Release = {
  tag_name: 'v0.8.0',
  assets: [
    { name: 'latest.json', browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/latest.json', size: 667 },
    {
      name: 'Scribe_0.8.0_x64-setup.exe',
      browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe_0.8.0_x64-setup.exe',
      size: 12519464,
    },
    {
      name: 'Scribe_0.8.0_x64_en-US.msi',
      browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe_0.8.0_x64_en-US.msi',
      size: 30674944,
    },
    // The Mac and Linux betas (2026-11-09), under the stable names their release step gives them.
    {
      name: 'Scribe-macos-universal.dmg',
      browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe-macos-universal.dmg',
      size: 21495808,
    },
    {
      name: 'Scribe-linux-x86_64.AppImage',
      browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe-linux-x86_64.AppImage',
      size: 88080384,
    },
    {
      name: 'Scribe-linux-amd64.deb',
      browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe-linux-amd64.deb',
      size: 9437184,
    },
  ],
}

/** The releases page: where a visitor lands when the file can't be found. */
export const releasesPage = (download: Download) => `https://github.com/${download.repo}/releases/latest`

export interface Asset {
  url: string
  /** The release's tag, e.g. "v0.8.0". */
  version: string
  /** The file's size in bytes, as GitHub reports it. */
  size: number
}

/** The newest release's file for `download`, or null when GitHub can't say. */
export async function latestAsset(download: Download): Promise<Asset | null> {
  try {
    let release: Release
    if (usesFixtures()) {
      release = FIXTURE
    } else {
      const token = process.env.GITHUB_TOKEN
      const res = await fetch(`https://api.github.com/repos/${download.repo}/releases/latest`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'n8builds-web',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Six hours, like the build log: a new release is picked up the same day.
        next: { revalidate: 21600 },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return null
      release = (await res.json()) as Release
    }
    const file = release.assets.find((a) => download.asset.test(a.name))
    return file ? { url: file.browser_download_url, version: release.tag_name, size: file.size } : null
  } catch {
    return null
  }
}

/** A file size the way Windows shows it (binary megabytes), e.g. 12519464 -> "12 MB". */
export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`
}

/**
 * What a download button fetches, said under it: "Windows 10 and 11, 64-bit ·
 * v0.8.0 · 12 MB" from the newest release, just the platforms when GitHub
 * can't say. Scribe supports Windows 10 and 11, 64-bit only (its README).
 */
export async function downloadCaption(app: string): Promise<string | undefined> {
  const download = DOWNLOADS[app]
  if (!download) return undefined
  const asset = await latestAsset(download)
  return ['Windows 10 and 11, 64-bit', ...(asset ? [asset.version, formatSize(asset.size)] : [])].join(' · ')
}
