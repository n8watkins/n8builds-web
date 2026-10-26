import Image from 'next/image'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FiBriefcase, FiCheck, FiFileText, FiGithub } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import RepoButtons from '@/components/ui/RepoButtons'
import Reveal from '@/components/ui/Reveal'

/**
 * In the Lab, right after the featured builds: a prompt to the visitor who is
 * building their own site, with both of mine as public templates. Two cards
 * with the anatomy of a Lab row (components/sections/FeaturedProjects.tsx)
 * and no screenshots: what you get if you fork it, what it's built with, how
 * it is built and tested, and the repo. Hiring is the PortfolioAd section's
 * job, not this one's.
 */

interface Template {
  title: string
  /** The live site, as a link under the title. */
  site: { label: string; href: string; internal?: boolean }
  /** The N8 mark belongs to n8builds.dev; the portfolio gets a neutral icon chip. */
  mark: { image: string } | { icon: IconType }
  /** What you get if you fork it. */
  description: string
  /** What it's built with. */
  tags: string[]
  /**
   * How it is built and tested: this site's case study, or (with no build page
   * for the portfolio) the CI section of its README.
   */
  howItsBuilt: { href: string; internal?: boolean }
  repoName: string
  repo: string
}

/**
 * Under the heading. Both repos are MIT-licensed, and both run lint, types and
 * Playwright in GitHub Actions on every pull request.
 */
const POINTS = ['Open source', 'MIT-licensed', 'Tested on every pull request']

const TEMPLATES: Template[] = [
  {
    title: 'This site',
    site: { label: 'n8builds.dev', href: '/', internal: true },
    mark: { image: '/tab/n8-icon-192.png' },
    description:
      'A server-rendered Next.js 16 site with a Sanity blog, a build log, a contact form behind Turnstile and rate limits, and a speed-first setup tested on five browsers. A clean start for building in public.',
    tags: ['Next.js 16', 'Sanity', 'Tailwind CSS 4', 'Turnstile', 'Upstash', 'Vercel'],
    howItsBuilt: { href: '/builds/n8builds', internal: true },
    repoName: 'n8builds-web',
    repo: 'https://github.com/n8watkins/n8builds-web',
  },
  {
    title: 'My developer portfolio',
    site: { label: 'portfolio.n8builds.dev', href: 'https://portfolio.n8builds.dev' },
    mark: { icon: FiBriefcase },
    description:
      'A Next.js 16 portfolio with a page per project, live demo status from OpenPing, room for client work and experience, and generated share cards. A clean start for a portfolio of your own.',
    tags: ['Next.js 16', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    howItsBuilt: { href: 'https://github.com/n8watkins/dev-portfolio#ci-and-deploys' },
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

const TemplateCard = ({ t }: { t: Template }) => (
  <li className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
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
    <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{t.description}</p>
    <ul aria-label={`${t.title} is built with`} className="mt-2.5 flex flex-wrap gap-1.5">
      {t.tags.map((tag) => (
        <li
          key={tag}
          className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400"
        >
          {tag}
        </li>
      ))}
    </ul>

    {/* How it's built, then the repo. Pinned to the bottom so the two cards line up. */}
    <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
      {t.howItsBuilt.internal ? (
        <Link href={t.howItsBuilt.href} className={primary}>
          <FiFileText className="h-3.5 w-3.5" aria-hidden="true" />
          How it is built and tested
        </Link>
      ) : (
        <a href={t.howItsBuilt.href} target="_blank" rel="noopener noreferrer" className={primary}>
          <FiGithub className="h-3.5 w-3.5" aria-hidden="true" />
          How it is built and tested
          <span className="sr-only"> (its README on GitHub, opens in a new tab)</span>
        </a>
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
    <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
      <LabSubheader
        title={
          <>
            Don&apos;t have a site? Need help building your own?
            {/* Same size, the tagline's gradient. Underlined in cyan: the gradient clips the text, so the line needs its own colour. */}
            <span className="block w-fit bg-linear-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text pb-1 text-transparent underline decoration-cyan-400/70 decoration-2 underline-offset-[6px]">
              Use mine as a template.
            </span>
          </>
        }
        blurb={
          <span className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5">
            {POINTS.map((point) => (
              <span
                key={point}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-200"
              >
                <FiCheck className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
                {point}
              </span>
            ))}
          </span>
        }
      />
      <ul className="grid gap-5 md:grid-cols-2">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.title} t={t} />
        ))}
      </ul>
    </Reveal>
  </section>
)

export default UseAsTemplate
