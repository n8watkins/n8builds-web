import Image from 'next/image'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FiBriefcase, FiExternalLink, FiFileText, FiGithub } from 'react-icons/fi'
import StarButton from '@/components/ui/StarButton'

/**
 * Both of my sites are public templates: two cards with the anatomy of a Lab
 * row (components/sections/FeaturedProjects.tsx) and no screenshots. Each says
 * what you get if you fork it and what it's built with. How n8builds is built
 * and tested lives here, not in a featured row; the full story is
 * /builds/n8builds. Hiring is the PortfolioAd section's job, not this one's.
 */

interface Template {
  title: string
  /** The site's address, under the title, when the title isn't the address. */
  address?: string
  /** The N8 mark belongs to n8builds.dev; the portfolio gets a neutral icon chip. */
  mark: { image: string } | { icon: IconType }
  /** What you get if you fork it. */
  description: string
  /** What it's built with. */
  tags: string[]
  /** The card's main button: somewhere the GitHub and Star buttons don't go. */
  action: { label: string; href: string; internal?: boolean }
  repoName: string
  repo: string
}

const TEMPLATES: Template[] = [
  {
    title: 'n8builds.dev',
    mark: { image: '/tab/n8-icon-192.png' },
    description:
      'A server-rendered Next.js 16 site with a Sanity blog, a build log, a contact form behind Turnstile and rate limits, and a speed-first setup tested on five browsers. A clean start for building in public.',
    tags: ['Next.js 16', 'Sanity', 'Tailwind CSS 4', 'Turnstile', 'Upstash', 'Vercel'],
    action: { label: 'How it is built and tested', href: '/builds/n8builds', internal: true },
    repoName: 'n8builds-web',
    repo: 'https://github.com/n8watkins/n8builds-web',
  },
  {
    title: 'My developer portfolio',
    address: 'portfolio.n8builds.dev',
    mark: { icon: FiBriefcase },
    description:
      'A Next.js 16 portfolio with a page per project, live demo status from OpenPing, room for client work and experience, and generated share cards. A clean start for a portfolio of your own.',
    tags: ['Next.js 16', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    action: { label: 'See it live', href: 'https://portfolio.n8builds.dev' },
    repoName: 'dev-portfolio',
    repo: 'https://github.com/n8watkins/dev-portfolio',
  },
]

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100'

const primary = `${buttonBase} bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400`

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
        <h3 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">{t.title}</h3>
        {t.address && <p className="text-sm font-semibold text-blue-300">{t.address}</p>}
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

    {/* The Lab's button order: the main action, then Star and GitHub on a line of their own,
        so both cards' buttons sit the same way. Pinned to the bottom so the cards line up. */}
    <div className="mt-auto flex flex-col items-start gap-2 pt-5">
      {t.action.internal ? (
        <Link href={t.action.href} className={primary}>
          <FiFileText className="h-3.5 w-3.5" aria-hidden="true" />
          {t.action.label}
        </Link>
      ) : (
        <a href={t.action.href} target="_blank" rel="noopener noreferrer" className={primary}>
          <FiExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          {t.action.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      <div className="flex flex-wrap gap-2">
        <StarButton href={t.repo} name={t.repoName} />
        <a
          href={t.repo}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8`}
        >
          <FiGithub className="h-3.5 w-3.5" aria-hidden="true" />
          GitHub<span className="sr-only"> repository {t.repoName} (opens in a new tab)</span>
        </a>
      </div>
    </div>
  </li>
)

const UseAsTemplate = () => (
  <section id="template" aria-labelledby="template-heading" className="py-10">
    <h2
      id="template-heading"
      className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
    >
      Use this as a template
    </h2>
    <p className="mt-2 max-w-[600px] text-[#9cadc5]">
      Both of my sites are public. Fork either one, keep what helps, and make it yours.
    </p>
    <p className="mt-1.5 text-sm text-slate-450">
      Both are MIT-licensed (the portfolio&apos;s photos and write-ups stay mine).
    </p>
    <ul className="mt-6 grid gap-5 md:grid-cols-2">
      {TEMPLATES.map((t) => (
        <TemplateCard key={t.title} t={t} />
      ))}
    </ul>
  </section>
)

export default UseAsTemplate
