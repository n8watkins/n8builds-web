import Image from 'next/image'
import Link from 'next/link'
import { refHref } from '@/lib/referrals'
import type { IconType } from 'react-icons'
import { FiBriefcase, FiFileText } from 'react-icons/fi'
import { LuActivity, LuCloud, LuLayoutPanelTop, LuPenLine, LuScrollText, LuShieldCheck, LuUserRound } from 'react-icons/lu'
import LabSubheader from '@/components/sections/LabSubheader'
import RepoButtons from '@/components/ui/RepoButtons'
import Reveal from '@/components/ui/Reveal'

/**
 * In the Lab, right after the featured builds: a prompt to the visitor who is
 * building their own site, with both of mine as public templates, as two cards
 * side by side (owner, round 11 of 2026-11-09: tight, no divider). Each card:
 * the name and live site, who it is for in a line, a short "what you get"
 * list with an icon for each thing, then the full story (this site's build
 * page, the only one with one) and the repo. Hiring is the PortfolioAd
 * section's job, not this one's.
 */

interface Template {
  title: string
  /** The live site, as a link under the title. */
  site: { label: string; href: string; internal?: boolean }
  /** The N8 mark belongs to n8builds.dev; the portfolio gets a neutral icon chip. */
  mark: { image: string } | { icon: IconType }
  /** Who it is for, in a line. */
  forWhat: string
  /** What you get if you fork it: a few things, each with its icon. */
  gets: { icon: IconType; label: string }[]
  /**
   * Its full story: a build page on this site. The portfolio has none, and its
   * repo is already the GitHub half of RepoButtons.
   */
  story?: string
  repoName: string
  repo: string
}

const TEMPLATES: Template[] = [
  {
    title: 'My personal site',
    site: { label: 'n8builds.dev', href: '/', internal: true },
    mark: { image: '/tab/n8-icon-192.png' },
    forWhat: 'For building in public: your writing, your builds and a way to reach you.',
    gets: [
      { icon: LuPenLine, label: 'A blog you write in Sanity' },
      { icon: LuScrollText, label: 'A build log from GitHub' },
      { icon: LuShieldCheck, label: 'A contact form that stops spam' },
      { icon: LuCloud, label: 'Runs on Cloudflare' },
    ],
    story: '/builds/n8builds',
    repoName: 'n8builds-web',
    repo: 'https://github.com/n8watkins/n8builds-web',
  },
  {
    title: 'My developer portfolio',
    site: { label: 'portfolio.n8builds.dev', href: refHref('portfolio', 'lab') },
    mark: { icon: FiBriefcase },
    forWhat: 'For getting hired: your best projects, in front of the people hiring.',
    gets: [
      { icon: LuLayoutPanelTop, label: 'A page per project' },
      { icon: LuActivity, label: 'Live demo status' },
      { icon: LuUserRound, label: 'About, experience, contact' },
      { icon: LuCloud, label: 'Runs on Cloudflare' },
    ],
    repoName: 'dev-portfolio',
    repo: 'https://github.com/n8watkins/dev-portfolio',
  },
]

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100'

const primary = `${buttonBase} bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400`

const siteLink =
  'text-sm font-semibold text-blue-300 underline decoration-blue-300/30 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200/60'

const Mark = ({ mark }: { mark: Template['mark'] }) =>
  'image' in mark ? (
    <Image src={mark.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-300/30">
      <mark.icon className="h-5 w-5" aria-hidden="true" />
    </span>
  )

/** One template's card: its name and site, who it is for, what you get, and its links. */
const TemplateCard = ({ t }: { t: Template }) => (
  // Four rows (name, who it is for, what you get, links) shared with the other card
  // (a subgrid from 768px), so each starts level with its neighbour's.
  <li
    className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-200 hover:border-cyan-300/25 md:row-span-4 md:grid md:grid-rows-subgrid md:gap-y-0"
    data-template={t.repoName}
  >
    <div className="flex items-center gap-3">
      <Mark mark={t.mark} />
      <div className="min-w-0">
        <h4 className="text-xl font-bold tracking-tight text-slate-50">{t.title}</h4>
        {t.site.internal ? (
          <Link href={t.site.href} className={siteLink}>
            {t.site.label}
          </Link>
        ) : (
          <a href={t.site.href} target="_blank" rel="noopener noreferrer" className={siteLink}>
            {t.site.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-pretty text-slate-300" data-template-for>
      {t.forWhat}
    </p>
    <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 min-[420px]:grid-cols-2" aria-label={`What you get with ${t.title.toLowerCase()}`}>
      {t.gets.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-sm text-[#9cadc5]">
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-300" />
          {label}
        </li>
      ))}
    </ul>
    {/* The full story, then the repo. */}
    <div className="mt-auto flex flex-wrap items-center gap-2 self-start pt-4 md:self-end">
      {t.story && (
        <Link href={t.story} className={primary}>
          <FiFileText className="h-3.5 w-3.5" aria-hidden="true" />
          Full story
          <span className="sr-only"> of {t.title}</span>
        </Link>
      )}
      <RepoButtons href={t.repo} name={t.repoName} />
    </div>
  </li>
)

const UseAsTemplate = () => (
  // A full-bleed part of the Lab in its own cyan wash (`.lab-part-wash` and
  // `.lab-accent-template` in app/globals.css), its content at the Lab's width.
  <section
    id="template"
    aria-label="Use my sites as templates"
    className="lab-accent-template lab-part-wash py-10"
  >
    {/* The Lab doesn't reveal itself, so its parts do. */}
    <Reveal className="mx-auto max-w-site px-5 sm:px-8">
      <LabSubheader
        title={
          <>
            {/* Tight (owner, 2026-11-09: "Use mine as a template!" before); the Lab's checks
                above say they are open source and tested, so it has none of its own. */}
            Don&apos;t have a site?{' '}
            {/* Same size, the tagline's gradient. Underlined in cyan: the gradient clips the text, so the line needs its own colour. */}
            <span className="inline-block bg-linear-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text pb-1 whitespace-nowrap text-transparent underline decoration-cyan-400/70 decoration-2 underline-offset-[6px]">
              Use mine!
            </span>
          </>
        }
      />
      {/* The two side by side from 768px, one over the other on a phone. */}
      <ul className="grid gap-4 md:grid-cols-2 md:grid-rows-[repeat(4,auto)]" aria-label="My two templates, compared" data-template-compare>
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.title} t={t} />
        ))}
      </ul>
    </Reveal>
  </section>
)

export default UseAsTemplate
