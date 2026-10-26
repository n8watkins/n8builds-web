import Image from 'next/image'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FiArrowUpRight, FiBriefcase, FiCheck, FiFileText, FiGitBranch, FiShield } from 'react-icons/fi'
import StarButton from '@/components/ui/StarButton'

/**
 * Right after the Lab: both of my sites are public templates. Two cards with
 * the anatomy of a Lab row (components/sections/FeaturedProjects.tsx) and no
 * screenshots: the stack as pills, then a box of what the engineering does.
 * The portfolio card is also the homepage's ad for the developer portfolio
 * (hiring? start there), so it carries that pitch and its buttons. Every
 * claim is checked against its repo; the full story of this site is
 * /builds/n8builds.
 */

const PORTFOLIO = 'https://portfolio.n8builds.dev'

const accents = {
  cyan: {
    icon: FiShield,
    box: 'border-cyan-400/25 from-cyan-500/[0.09] to-blue-600/[0.04]',
    chip: 'bg-cyan-400/15 text-cyan-300 ring-cyan-300/25',
    check: 'text-cyan-300',
  },
  teal: {
    icon: FiBriefcase,
    box: 'border-teal-400/25 from-teal-500/[0.09] to-cyan-500/[0.04]',
    chip: 'bg-teal-400/15 text-teal-300 ring-teal-300/25',
    check: 'text-teal-300',
  },
} satisfies Record<string, { icon: IconType; box: string; chip: string; check: string }>

interface Action {
  label: string
  href: string
  kind: 'primary' | 'secondary'
  /** A page on this site; anything else opens in a new tab. */
  internal?: boolean
}

interface Template {
  /** Small label above the title. */
  label: string
  title: string
  /** The site's address, under the title, when the title isn't the address. */
  address?: string
  /** The N8 mark belongs to n8builds.dev; the portfolio gets a neutral icon chip. */
  mark: { image: string } | { icon: IconType }
  description: string
  /** What it's built with. */
  tags: string[]
  /** The essentials of how it's engineered. */
  points: string[]
  /** The box's buttons: each goes somewhere the card's other buttons don't. */
  actions: Action[]
  repoName: string
  repo: string
  license: string
  accent: keyof typeof accents
}

const TEMPLATES: Template[] = [
  {
    label: 'This site',
    title: 'n8builds.dev',
    mark: { image: '/tab/n8-icon-192.png' },
    description:
      'Server-rendered and built speed first: CSS animations, small client islands, a Sanity blog, and nothing merges until the tests and budgets pass.',
    tags: ['Next.js 16', 'Sanity', 'Tailwind CSS 4', 'Turnstile', 'Upstash', 'Vercel'],
    points: ['Playwright on five browsers, every PR', 'Lighthouse budgets, desktop and mobile', 'Contact form fails closed behind Turnstile'],
    actions: [{ label: 'How it is built and tested', href: '/builds/n8builds', kind: 'primary', internal: true }],
    repoName: 'n8builds-web',
    repo: 'https://github.com/n8watkins/n8builds-web',
    license: 'MIT',
    accent: 'cyan',
  },
  {
    label: 'Hiring?',
    title: 'My developer portfolio',
    address: 'portfolio.n8builds.dev',
    mark: { icon: FiBriefcase },
    description:
      "AI projects with live demos (a realtime voice agent, a research agent, a Gemini chat platform), the client sites I've shipped, and my experience. Building your own? Fork it.",
    tags: ['Next.js 16', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    points: ['Live demo status from OpenPing', 'Lint, types, unit and E2E tests on every PR'],
    actions: [
      { label: 'See my portfolio', href: PORTFOLIO, kind: 'primary' },
      { label: 'Jump to the projects', href: `${PORTFOLIO}/#projects`, kind: 'secondary' },
    ],
    repoName: 'dev-portfolio',
    repo: 'https://github.com/n8watkins/dev-portfolio',
    license: 'MIT for the code; my photos and write-ups stay mine',
    accent: 'teal',
  },
]

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100'

const actionClass = (kind: Action['kind']) =>
  kind === 'primary'
    ? `${buttonBase} rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400`
    : `${buttonBase} rounded-lg border border-cyan-400/30 bg-white/4 text-cyan-200 hover:bg-white/8`

const ActionLink = ({ action }: { action: Action }) =>
  action.internal ? (
    <Link href={action.href} className={actionClass(action.kind)}>
      <FiFileText className="h-3.5 w-3.5" aria-hidden="true" />
      {action.label}
    </Link>
  ) : (
    <a href={action.href} target="_blank" rel="noopener noreferrer" className={actionClass(action.kind)}>
      {action.label}
      <FiArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )

const Mark = ({ mark }: { mark: Template['mark'] }) =>
  'image' in mark ? (
    <Image src={mark.image} alt="" width={44} height={44} className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-300/30 sm:h-11 sm:w-11">
      <mark.icon className="h-5 w-5" aria-hidden="true" />
    </span>
  )

const TemplateCard = ({ t }: { t: Template }) => {
  const accent = accents[t.accent]
  const Icon = accent.icon
  return (
    <li className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Mark mark={t.mark} />
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-450">{t.label}</p>
          <h3 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">{t.title}</h3>
          {t.address && <p className="text-sm font-semibold text-blue-300">{t.address}</p>}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{t.description}</p>
      <ul aria-label={`${t.title} is built with`} className="mt-2.5 flex flex-wrap gap-1.5">
        {t.tags.map((tag) => (
          <li key={tag} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400">
            {tag}
          </li>
        ))}
      </ul>

      <div role="group" aria-label={`About ${t.title}`} className={`mt-4 rounded-xl border bg-linear-to-br p-3.5 ${accent.box}`}>
        <div className="flex items-start gap-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${accent.chip}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <ul className="min-w-0 space-y-1 pt-1">
            {t.points.map((point) => (
              <li key={point} className="flex items-start gap-1.5 text-sm font-semibold text-slate-100">
                <FiCheck className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${accent.check}`} aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {t.actions.map((action) => (
            <ActionLink key={action.href} action={action} />
          ))}
        </div>
      </div>

      {/* The template part: fork it or star it. Pinned to the bottom so the two cards line up. */}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-2">
          <a
            href={`${t.repo}/fork`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8`}
          >
            <FiGitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            {/* On the narrowest phones only "Fork" shows, so it shares a line with Star. */}
            <span>
              Fork<span className="max-[399px]:sr-only"> {t.repoName}</span>
              <span className="sr-only"> on GitHub (opens in a new tab)</span>
            </span>
          </a>
          <StarButton href={t.repo} name={t.repoName} />
        </div>
        <p className="mt-2 text-xs text-slate-450">License: {t.license}</p>
      </div>
    </li>
  )
}

const UseAsTemplate = () => (
  <section id="template" aria-labelledby="template-heading" className="py-10">
    <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-teal-400">Open source</p>
    <h2 id="template-heading" className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
      Use this as a template
    </h2>
    <p className="mt-2 max-w-[600px] text-[#9cadc5]">
      Both of my sites are public. Fork either one, keep what helps, and make it yours.
    </p>
    <ul className="mt-6 grid gap-5 md:grid-cols-2">
      {TEMPLATES.map((t) => (
        <TemplateCard key={t.title} t={t} />
      ))}
    </ul>
  </section>
)

export default UseAsTemplate
