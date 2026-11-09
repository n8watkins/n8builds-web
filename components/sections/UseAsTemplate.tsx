import Image from 'next/image'
import Link from 'next/link'
import { refHref } from '@/lib/referrals'
import type { IconType } from 'react-icons'
import { FiBriefcase, FiCheck, FiFileText } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import RepoButtons from '@/components/ui/RepoButtons'
import Reveal from '@/components/ui/Reveal'

/**
 * In the Lab, right after the featured builds: a prompt to the visitor who is
 * building their own site, with both of mine as public templates. One
 * full-width panel that compares them side by side (owner, round 10 of
 * 2026-11-09; two separate cards before): for each, the name and live site,
 * what it is for and what you get if you fork it, then the full story (this
 * site's build page, the only one with one) and the repo. No stack pills: the
 * build page has the stack. Hiring is the PortfolioAd section's job, not this
 * one's.
 */

interface Template {
  title: string
  /** The live site, as a link under the title. */
  site: { label: string; href: string; internal?: boolean }
  /** The N8 mark belongs to n8builds.dev; the portfolio gets a neutral icon chip. */
  mark: { image: string } | { icon: IconType }
  /** What it is for, in a few words. */
  forWhat: string
  /** What you get if you fork it: a few short points. */
  gets: string[]
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
    forWhat: 'Building in public: one home for your writing, your builds and a way to reach you.',
    gets: [
      'A blog you write in Sanity',
      'A build log from your GitHub releases',
      'A contact form with spam protection',
      'Runs on Cloudflare, tested on five browsers',
    ],
    story: '/builds/n8builds',
    repoName: 'n8builds-web',
    repo: 'https://github.com/n8watkins/n8builds-web',
  },
  {
    title: 'My developer portfolio',
    site: { label: 'portfolio.n8builds.dev', href: refHref('portfolio', 'lab') },
    mark: { icon: FiBriefcase },
    forWhat: 'Getting hired: your best projects, in front of the people hiring.',
    gets: [
      'A page per project, with screenshots and its stack',
      'Live demo status on every project',
      'About, experience and contact',
      'Share cards made for every page',
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

const label = 'font-mono text-[0.68rem] font-bold tracking-[0.16em] text-cyan-400/90 uppercase'

const Mark = ({ mark }: { mark: Template['mark'] }) =>
  'image' in mark ? (
    <Image
      src={mark.image}
      alt=""
      width={44}
      height={44}
      className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11"
    />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-300/30 sm:h-11 sm:w-11">
      <mark.icon className="h-5 w-5" aria-hidden="true" />
    </span>
  )

/** One side of the comparison: a template's name and site, what it is for, what you get, and its links. */
const TemplateColumn = ({ t }: { t: Template }) => (
  // Four rows (name, what it is for, what you get, links) shared with the other column
  // (a subgrid from 768px), so each starts level with its neighbour's.
  <li className="flex min-w-0 flex-col p-5 sm:p-6 md:row-span-4 md:grid md:grid-rows-subgrid lg:p-7" data-template={t.repoName}>
    <div className="flex items-center gap-3">
      <Mark mark={t.mark} />
      <div className="min-w-0">
        <h4 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">{t.title}</h4>
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
    <div className="mt-4 text-sm sm:text-[0.95rem]">
      <p className={label}>For</p>
      <p className="mt-1 leading-relaxed text-pretty text-slate-200" data-template-for>
        {t.forWhat}
      </p>
    </div>
    <div className="mt-3 text-sm sm:text-[0.95rem]">
      <p className={label}>You get</p>
      <ul className="mt-1.5 grid gap-1.5" aria-label={`What you get with ${t.title.toLowerCase()}`}>
        {t.gets.map((point) => (
          <li key={point} className="flex items-start gap-2 leading-snug text-[#9cadc5]">
            <FiCheck aria-hidden="true" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-cyan-300" />
            {point}
          </li>
        ))}
      </ul>
    </div>

    {/* The full story, then the repo. Pinned to the bottom so the two columns line up. */}
    <div className="mt-auto flex flex-wrap items-center gap-2 self-end pt-5">
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
    className="lab-accent-template lab-part-wash py-12"
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
      {/* One panel, the two templates compared side by side from 768px, one over the other on a phone. */}
      <ul
        className="grid divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/[0.03] md:grid-cols-2 md:grid-rows-[repeat(4,auto)] md:divide-x md:divide-y-0"
        aria-label="My two templates, compared"
        data-template-compare
      >
        {TEMPLATES.map((t) => (
          <TemplateColumn key={t.title} t={t} />
        ))}
      </ul>
    </Reveal>
  </section>
)

export default UseAsTemplate
