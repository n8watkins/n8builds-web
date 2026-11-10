'use client'
import { FiDownload } from 'react-icons/fi'
import { usePlatform } from '@/hooks/usePlatform'
import { SCRIBE_OS } from '@/components/sections/ScribeActions'
import type { DesktopOs, PlatformDownload } from '@/lib/downloads'

/**
 * One compact "Download for <your OS>" button for Scribe (round 9 of
 * 2026-11-09: My dev setup's sharing row): the file for the visitor's
 * computer, from n8builds.dev/download/<app>, with Beta on the Mac and Linux
 * builds. The server renders the Windows one and the browser checks its
 * platform once hydrated (usePlatform); a phone or tablet keeps Windows, the
 * main build. Every version is the same height, so nothing moves.
 */
export default function ScribeDownloadButton({
  downloads,
  className = '',
}: {
  downloads: Record<DesktopOs, PlatformDownload>
  className?: string
}) {
  const platform = usePlatform()
  const os: DesktopOs = platform === 'other' ? 'windows' : platform
  const download = downloads[os]
  const { name, icon: Icon } = SCRIBE_OS[os]
  return (
    <a
      href={download.href}
      data-scribe-download={os}
      title={download.facts}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-linear-to-r from-blue-600 to-sky-700 px-3 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:from-blue-700 hover:to-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${className}`}
    >
      <FiDownload aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span>
        Download for <Icon aria-hidden="true" className="mr-0.5 inline-block h-3 w-3 align-[-1px]" />
        {name}
      </span>
      {download.beta && <span className="rounded bg-white/15 px-1 py-px text-[0.6rem] font-bold tracking-wider uppercase">Beta</span>}
      <span className="sr-only"> (Scribe, {download.facts})</span>
    </a>
  )
}
