import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import CookieSettingsButton from '@/components/consent/CookieSettingsButton'
import { SOCIALS, isExternal, type Social } from '@/data/socials'
import { isOutbound, refHref } from '@/lib/referrals'
import { TECH_FOR_PROS } from '@/lib/techForPros'
import TechForProsMark from '@/components/ui/TechForProsMark'

/**
 * The footer on every page: a sitemap (every page and section, so the build
 * log and the rest are always one click away), then the copyright and socials.
 * The homepage's contact card sits just above it.
 */

const SITEMAP: { heading: string; links: { label: string; href: string; mark?: ReactNode }[]; cookieSettings?: boolean }[] = [
  {
    heading: 'The Lab',
    links: [
      { label: 'Featured builds', href: '/#featured' },
      { label: 'Chrome extensions', href: '/#extensions' },
      { label: 'Build log', href: '/builds' },
      { label: 'Upcoming', href: '/upcoming' },
      { label: 'Use as a template', href: '/#template' },
      { label: 'Tools I built and use', href: '/#tools-i-built' },
    ],
  },
  {
    heading: 'Read and watch',
    links: [
      { label: 'Notions', href: '/blog' },
      { label: 'Live', href: '/live' },
      { label: 'People I follow', href: '/#people' },
      { label: 'Loadout', href: '/#loadout' },
    ],
  },
  {
    heading: 'Work with me',
    links: [
      { label: 'Developer portfolio', href: 'https://portfolio.n8builds.dev' },
      // Counted, like the navbar's (lib/referrals.ts).
      { label: TECH_FOR_PROS.domain, href: refHref('techforpros', 'footer'), mark: <TechForProsMark className="h-[18px] w-[18px] shadow-none" sizes="18px" /> },
      { label: 'Contact form', href: '/#contact' },
      { label: 'contact@n8builds.dev', href: 'mailto:contact@n8builds.dev' },
    ],
  },
  {
    heading: 'Site',
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/n8watkins/n8builds-web' },
      { label: 'Privacy', href: '/privacy' },
    ],
    // Reopens the analytics consent banner (components/consent).
    cookieSettings: true,
  },
]
const ICON_SIZE: Record<Social['size'], string> = { sm: 'h-4.5 w-4.5', md: 'h-5 w-5', lg: 'h-6 w-6' }

const SiteFooter = () => (
  <footer className="relative z-10 border-t border-white/8 bg-darkBlue">
    {/* Fades up as it scrolls into view, like the sections above it. */}
    <Reveal className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-8">
      <nav aria-label="Sitemap" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {SITEMAP.map((group) => (
          <div key={group.heading}>
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">{group.heading}</p>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  {isOutbound(link.href) ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-fit items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-cyan-200"
                    >
                      {/* A 24px flex row, the height of the other links' lines, so an icon doesn't nudge the text off them. */}
                      {link.mark}
                      {/* One text run, so a wrapped label keeps its arrow on the last line. */}
                      <span>
                        {link.label}
                        <span aria-hidden="true" className="ml-1.5 text-slate-500">↗</span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </span>
                    </a>
                  ) : link.href.startsWith('mailto:') ? (
                    <a href={link.href} className="text-sm text-slate-300 transition-colors hover:text-cyan-200">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-slate-300 transition-colors hover:text-cyan-200">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              {group.cookieSettings && (
                <li>
                  <CookieSettingsButton className="cursor-pointer text-left text-sm text-slate-300 transition-colors hover:text-cyan-200" />
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-10 flex flex-col-reverse items-center justify-between gap-6 border-t border-white/8 pt-6 lg:flex-row">
        <div className="flex items-center gap-2.5">
          <Image src="/brand/n8-mark.png" alt="" width={1086} height={826} sizes="27px" className="h-5 w-auto" />
          <span className="text-sm font-bold text-slate-200">n8builds</span>
        </div>
        <p className="text-xs text-slate-450 lg:text-sm">© 2026 n8builds.dev. All rights reserved.</p>
        <nav aria-label="Footer social media links" className="flex items-center gap-1">
          {SOCIALS.map(({ label, href, Icon, size, color }) => (
            <a
              key={label}
              href={href}
              {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={label}
              title={label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
            >
              <Icon aria-hidden className={`${ICON_SIZE[size]} ${color ?? ''}`} />
            </a>
          ))}
        </nav>
      </div>
    </Reveal>
  </footer>
)

export default SiteFooter
