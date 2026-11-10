'use client'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6'
import { FiDownload, FiFileText } from 'react-icons/fi'
import { usePlatform } from '@/hooks/usePlatform'
import type { DesktopOs, PlatformDownload } from '@/lib/downloads'

/** A button in the row: the same box for the solid and the outline look, so swapping them shifts nothing. */
const button =
  'inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 min-[360px]:px-4'
// Scribe's own blue (the Lab's Scribe row), white on it at 5:1 and up.
const solid = `${button} border border-transparent bg-linear-to-r from-blue-600 to-sky-700 text-white hover:from-blue-700 hover:to-sky-800`
const outline = `${button} border border-white/12 bg-white/4 text-slate-200 hover:border-white/20 hover:bg-white/8 hover:text-white`

/** Each OS's name and mark, as the download buttons show them. */
export const SCRIBE_OS: Record<DesktopOs, { name: string; icon: IconType }> = {
  windows: { name: 'Windows', icon: FaWindows },
  mac: { name: 'macOS', icon: FaApple },
  linux: { name: 'Linux', icon: FaLinux },
}

/**
 * Scribe's two main buttons and the line under them (owner, 2026-11-08; per
 * OS since 2026-11-09). Scribe ships for Windows, and for macOS (one universal
 * .dmg) and Linux (an AppImage, and a .deb) in beta. On a computer the
 * download for its OS leads, with what it fetches under it (and for a Mac the
 * one step its first run needs); anywhere else (a phone, a tablet) "Full
 * story" leads, the Windows download beside it. The server renders the
 * Windows version and the browser checks its platform once hydrated; every
 * version is the same size, and the line under them keeps room for two
 * lines, so nothing moves.
 */
export default function ScribeActions({
  downloads,
  story,
}: {
  /** Each OS's download (lib/downloads.ts, scribeDownloads). */
  downloads: Record<DesktopOs, PlatformDownload>
  /** Scribe's build page. */
  story: string
}) {
  const platform = usePlatform()
  const desktop = platform !== 'other'
  const os: DesktopOs = desktop ? platform : 'windows'
  const download = downloads[os]
  const { name, icon: Icon } = SCRIBE_OS[os]
  const downloadLink = (
    <a key="download" href={download.href} aria-describedby="scribe-download-note" className={desktop ? solid : outline}>
      <FiDownload className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Download for <Icon className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
        {name}
      </span>
      {download.beta && (
        <span className="rounded-md bg-white/15 px-1.5 py-px text-[0.65rem] font-bold tracking-wider uppercase">Beta</span>
      )}
    </a>
  )
  const storyLink = (
    <Link key="story" href={story} className={desktop ? outline : solid}>
      <FiFileText className="h-4 w-4 shrink-0" aria-hidden="true" />
      Full story
      <span className="sr-only"> of Scribe</span>
    </Link>
  )
  return (
    <div data-scribe-platform={platform} className="@container">
      {/* Side by side where the column has room (a container query), stacked where it hasn't. */}
      <div className="grid gap-2 @md:grid-cols-2">{desktop ? [downloadLink, storyLink] : [storyLink, downloadLink]}</div>
      <p id="scribe-download-note" className="mt-1.5 min-h-8 text-xs leading-4 text-pretty text-slate-400">
        {desktop ? (
          <>
            {download.facts}
            {download.alt && (
              <>
                {' · '}
                <a
                  href={download.alt.href}
                  className="font-semibold text-slate-300 underline decoration-white/25 underline-offset-2 hover:text-white"
                >
                  Also as a {download.alt.label}
                </a>
              </>
            )}
            {download.note && <span className="block">{download.note}</span>}
          </>
        ) : (
          'Desktop app for Windows, with macOS and Linux in beta.'
        )}
      </p>
    </div>
  )
}
