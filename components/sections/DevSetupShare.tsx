import Image from 'next/image'
import Link from 'next/link'
import { FiDownload, FiFileText, FiGithub } from 'react-icons/fi'
import { setupShares } from '@/data/loadout'
import { scribeDownloads } from '@/lib/downloads'
import ScribeDownloadButton from '@/components/sections/ScribeDownloadButton'

/** A small outline action in a share row. */
const action =
  'inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/12 bg-white/4 px-3 text-[13px] font-semibold text-slate-200 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'

/**
 * "Take it with you" under My dev setup (owner, round 9 of 2026-11-09: "add
 * sharing"): my public dotfiles and Kun Chen's, each to browse on GitHub or
 * download as a .zip, and Scribe, the dictation app I use all day, with a
 * download for the visitor's OS right in its row (usePlatform and
 * lib/downloads, as on its build page) beside the link to its page. On the
 * homepage's Loadout and on /loadout, one row per thing, its actions on the
 * right from 640px and under it on a phone: lined up with its words, or
 * under 360px from the row's left edge, so "Download for macOS (Beta)" fits a
 * narrow Mac window.
 */
export default async function DevSetupShare({ className = '' }: { className?: string }) {
  const downloads = await scribeDownloads()
  return (
    <div className={className} data-setup-share>
      <h4 className="font-mono text-[0.72rem] font-bold tracking-[0.16em] text-cyan-400 uppercase">Take it with you</h4>
      <ul className="mt-2.5 divide-y divide-white/6 rounded-xl border border-white/8 bg-white/[0.02]">
        {setupShares.map((share) => {
          const url = `https://github.com/${share.repo}`
          return (
            <li key={share.id} data-share={share.id} className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0a1428] text-slate-200 [&_svg]:size-4">
                  <FiGithub />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100">
                    {share.name} <span className="font-mono text-xs font-normal text-slate-400">{share.repo}</span>
                  </span>
                  <span className="block text-[13px] leading-snug text-[#9cadc5]">{share.what}</span>
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 min-[360px]:pl-11 sm:pl-0">
                <a href={url} target="_blank" rel="noopener noreferrer" className={action}>
                  <FiGithub aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  Browse
                  <span className="sr-only"> {share.name} on GitHub (opens in a new tab)</span>
                </a>
                <a href={`${url}/archive/refs/heads/${share.branch}.zip`} className={action}>
                  <FiDownload aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  .zip
                  <span className="sr-only"> download of {share.name}</span>
                </a>
              </div>
            </li>
          )
        })}
        <li data-share="scribe" className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <Image src="/builds/scribe/app-icon.png" alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg ring-1 ring-white/10" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-100">Scribe</span>
              <span className="block text-[13px] leading-snug text-[#9cadc5]">Local dictation I use every day: your audio never leaves your PC.</span>
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 min-[360px]:pl-11 sm:pl-0">
            <ScribeDownloadButton downloads={downloads} />
            <Link href="/builds/scribe" className={action}>
              <FiFileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              Its page
              <span className="sr-only"> (Scribe)</span>
            </Link>
          </div>
        </li>
      </ul>
    </div>
  )
}
