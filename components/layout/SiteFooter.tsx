import Image from 'next/image'
import Link from 'next/link'
import { FaXTwitter } from 'react-icons/fa6'
import { FiGithub, FiMail } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'

/**
 * The footer on every page: a sitemap (every page and section, so the build
 * log and the rest are always one click away), then the copyright and socials.
 * The homepage's contact card sits just above it.
 */

const SITEMAP: { heading: string; links: { label: string; href: string; icon?: string }[] }[] = [
  {
    heading: 'The Lab',
    links: [
      { label: 'Featured builds', href: '/#featured' },
      { label: 'Chrome extensions', href: '/#extensions' },
      { label: 'Build log', href: '/builds' },
      { label: 'Use as a template', href: '/#template' },
    ],
  },
  {
    heading: 'Read and watch',
    links: [
      { label: 'Notions', href: '/blog' },
      { label: 'Live', href: '/live' },
      { label: 'Loadout', href: '/#loadout' },
    ],
  },
  {
    heading: 'Work with me',
    links: [
      { label: 'Developer portfolio', href: 'https://portfolio.n8builds.dev' },
      { label: 'Appturnity', href: 'https://appturnity.com', icon: '/brands/appturnity.png' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  {
    heading: 'Site',
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/n8watkins/n8builds-web' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]
const SOCIALS = [
  { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="h-5 w-5" aria-hidden="true" /> },
  { href: 'https://x.com/n8watkins', label: 'X (Twitter)', icon: <FaXTwitter className="h-4.5 w-4.5" aria-hidden="true" /> },
  { href: 'https://www.linkedin.com/in/n8watkins/', label: 'LinkedIn', icon: <CiLinkedin className="h-6 w-6" aria-hidden="true" /> },
  { href: 'mailto:contact@n8builds.dev', label: 'Email', icon: <FiMail className="h-5 w-5" aria-hidden="true" /> },
]

const SiteFooter = () => (
  <footer className="relative z-10 border-t border-white/8 bg-darkBlue">
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-8">
      <nav aria-label="Sitemap" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {SITEMAP.map((group) => (
          <div key={group.heading}>
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">{group.heading}</p>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-cyan-200"
                    >
                      {link.icon && <Image src={link.icon} alt="" width={14} height={16} className="h-4 w-auto" />}
                      {link.label}
                      <span aria-hidden="true" className="text-slate-500">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-slate-300 transition-colors hover:text-cyan-200">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-10 flex flex-col-reverse items-center justify-between gap-6 border-t border-white/8 pt-6 lg:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="h-7 w-7 overflow-hidden rounded-lg ring-1 ring-white/10">
            <Image src="/tab/n8-logo.png" alt="" width={28} height={28} className="h-full w-full object-cover" />
          </span>
          <span className="text-sm font-bold text-slate-200">n8builds</span>
        </div>
        <p className="text-xs text-slate-450 lg:text-sm">© 2026 n8builds. All rights reserved.</p>
        <nav aria-label="Footer social media links" className="flex items-center gap-1">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              {...(s.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={s.label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
            >
              {s.icon}
            </a>
          ))}
        </nav>
      </div>
    </div>
  </footer>
)

export default SiteFooter
