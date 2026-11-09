'use client'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { FaWindows } from 'react-icons/fa6'
import { FiDownload, FiFileText } from 'react-icons/fi'

/** A button in the row: the same box for the solid and the outline look, so swapping them shifts nothing. */
const button =
  'inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 min-[360px]:px-4'
// Scribe's own blue (the Lab's Scribe row), white on it at 5:1 and up.
const solid = `${button} border border-transparent bg-linear-to-r from-blue-600 to-sky-700 text-white hover:from-blue-700 hover:to-sky-800`
const outline = `${button} border border-white/12 bg-white/4 text-slate-200 hover:border-white/20 hover:bg-white/8 hover:text-white`

function subscribe() {
  return () => {}
}

/**
 * Whether this browser runs on Windows: the client hint where there is one
 * (Chromium), else the user agent string. Phones and tablets are never Windows.
 */
function onWindows(): boolean {
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
  if (platform) return /^windows$/i.test(platform)
  return /Windows NT/i.test(navigator.userAgent)
}

/**
 * Scribe's two main buttons and the line under them (owner, 2026-11-08).
 * Scribe's releases are Windows only (an .exe and an .msi; macOS and Linux
 * builds exist only as experimental CI artifacts), so on Windows "Download for
 * Windows" leads, with the installer's facts under it; anywhere else (a Mac,
 * Linux, a phone) "Full story" leads and the line says the app is for Windows
 * for now. The server renders the Windows version and the browser checks its
 * platform once hydrated; both versions are the same size, so nothing moves.
 */
export default function ScribeActions({
  download,
  story,
  facts,
}: {
  /** The stable installer link (/download/scribe). */
  download: string
  /** Scribe's build page. */
  story: string
  /** The installer's facts (Windows versions, release, size). */
  facts: string
}) {
  const windows = useSyncExternalStore(subscribe, onWindows, () => true)
  const downloadLink = (
    <a key="download" href={download} aria-describedby="scribe-download-note" className={windows ? solid : outline}>
      <FiDownload className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Download for <FaWindows className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
        Windows
      </span>
    </a>
  )
  const storyLink = (
    <Link key="story" href={story} className={windows ? outline : solid}>
      <FiFileText className="h-4 w-4 shrink-0" aria-hidden="true" />
      Full story
      <span className="sr-only"> of Scribe</span>
    </Link>
  )
  return (
    <div data-scribe-platform={windows ? 'windows' : 'other'} className="@container">
      {/* Side by side where the column has room (a container query), stacked where it hasn't. */}
      <div className="grid gap-2 @md:grid-cols-2">
        {windows ? [downloadLink, storyLink] : [storyLink, downloadLink]}
      </div>
      <p id="scribe-download-note" className="mt-1.5 text-xs text-slate-400">
        {windows ? facts : 'Windows app. Mac and Linux coming.'}
      </p>
    </div>
  )
}
