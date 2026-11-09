'use client'
import type { IconType } from 'react-icons'
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6'
import { FiDownload } from 'react-icons/fi'
import { usePlatform } from '@/hooks/usePlatform'
import type { DesktopOs, PlatformDownload as Download } from '@/lib/downloads'

const OS: Record<DesktopOs, { name: string; quiet: string; icon: IconType }> = {
  windows: { name: 'Windows', quiet: 'Windows', icon: FaWindows },
  mac: { name: 'macOS', quiet: 'Mac (beta, not notarized)', icon: FaApple },
  linux: { name: 'Linux', quiet: 'Linux (beta)', icon: FaLinux },
}
const ORDER: DesktopOs[] = ['windows', 'mac', 'linux']

/**
 * A desktop app's download on its build page (owner, round 7 of 2026-11-09):
 * the main button is the download for the visitor's OS, as the homepage's
 * Scribe row does (hooks/usePlatform.ts), with what it fetches under it (the
 * Mac's first-run step, Linux's .deb); the other OSes are the quiet links
 * under it. A phone or tablet gets the Windows download, Mac and Linux quiet.
 * The server renders the Windows version, and every version keeps the same
 * shape, so nothing jumps once the browser has checked.
 */
export default function PlatformDownload({ downloads }: { downloads: Record<DesktopOs, Download> }) {
  const platform = usePlatform()
  const os: DesktopOs = platform === 'other' ? 'windows' : platform
  const main = downloads[os]
  const { name, icon: Icon } = OS[os]
  return (
    <div className="flex flex-col items-center" data-build-platform={platform}>
      <div className="flex max-w-full flex-col items-center gap-1.5">
        <a
          href={main.href}
          aria-describedby="build-download-facts"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors duration-200 hover:from-blue-700 hover:to-cyan-800"
        >
          <FiDownload aria-hidden className="h-4 w-4" />
          <span>
            Download for <Icon className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
            {name}
          </span>
          {main.beta && <span className="rounded-md bg-white/15 px-1.5 py-px text-[0.65rem] font-bold tracking-wider uppercase">Beta</span>}
        </a>
        <p id="build-download-facts" className="text-center text-xs text-slate-400">
          {main.facts}
          {main.alt && (
            <>
              {' · '}
              <a href={main.alt.href} className="font-semibold text-slate-300 underline decoration-white/25 underline-offset-2 hover:text-white">
                Also as a {main.alt.label}
              </a>
            </>
          )}
          {main.note && <span className="block">{main.note}</span>}
        </p>
      </div>
      {/* The other OSes share one line, quiet, wrapping on phones. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1" data-other-platforms>
        {ORDER.filter((o) => o !== os).map((o) => {
          const { quiet, icon: Mark } = OS[o]
          return (
            <a
              key={o}
              href={downloads[o].href}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
            >
              {/* One underline under the whole label, its mark included. */}
              <span className="border-b border-white/30 pb-px">
                <Mark className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
                {quiet}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
