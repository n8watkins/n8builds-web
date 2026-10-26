import Image from 'next/image'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FiCheck, FiExternalLink, FiFileText, FiGitBranch, FiGithub, FiShield } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import StarButton from '@/components/ui/StarButton'
import LabSubheader from '@/components/sections/LabSubheader'
import { ProjectGallery, type GalleryImage } from '@/components/sections/FeaturedProjectIslands'

/**
 * The Lab's last part: both of my sites are public templates. Each row has the
 * anatomy of a Lab row (components/sections/FeaturedProjects.tsx), focused on
 * the tech: the stack as pills, and a box of what the engineering does. How
 * n8builds is built and tested lives here, not in a featured row; the full
 * story is /builds/n8builds. Every claim is checked against its repo.
 */

const accents = {
  cyan: {
    icon: FiShield,
    box: 'border-cyan-400/25 from-cyan-500/[0.09] to-blue-600/[0.04]',
    chip: 'bg-cyan-400/15 text-cyan-300 ring-cyan-300/25',
    primary: 'bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400',
    secondary: 'border-cyan-400/30 text-cyan-200',
    check: 'text-cyan-300',
  },
  teal: {
    icon: FiGitBranch,
    box: 'border-teal-400/25 from-teal-500/[0.09] to-cyan-500/[0.04]',
    chip: 'bg-teal-400/15 text-teal-300 ring-teal-300/25',
    primary: 'bg-teal-400 text-slate-950 hover:bg-teal-300',
    secondary: 'border-teal-400/35 text-teal-200',
    check: 'text-teal-300',
  },
} satisfies Record<string, { icon: IconType; box: string; chip: string; primary: string; secondary: string; check: string }>

interface Template {
  /** The site, as it is named on the page (docs/DECISIONS.md: never the repo name). */
  name: string
  repoName: string
  subtitle: string
  description: string
  images: GalleryImage[]
  tags: string[]
  /** What the engineering does, as short checked points. */
  points: string[]
  license: string
  repo: string
  accent: keyof typeof accents
  /** The box's main action: a different door from the row's buttons. */
  action: { label: string; href: string; internal?: boolean }
  /** The live site; none for this one, you're on it. */
  liveSite?: string
}

const TEMPLATES: Template[] = [
  {
    name: 'n8builds.dev',
    repoName: 'n8builds-web',
    subtitle: 'This site',
    description:
      'A server-rendered Next.js site with a Sanity blog, built speed first: CSS animations, small client islands, and nothing merges until the tests and budgets pass.',
    images: [
      { src: '/builds/n8builds/lighthouse.webp', alt: "The CI Lighthouse report for n8builds.dev's homepage" },
      { src: '/builds/n8builds/ci-checks.webp', alt: 'A GitHub Actions run on a pull request: lint, types, unit tests, five browsers, the APIs and Lighthouse, all passing' },
      { src: '/builds/n8builds/home-hero.webp', alt: "n8builds.dev's homepage hero" },
    ],
    tags: ['Next.js 16', 'Sanity', 'Tailwind CSS 4', 'Playwright', 'Lighthouse', 'Turnstile', 'Upstash', 'Vercel'],
    points: [
      'Playwright on five browsers and the APIs, every PR',
      'Lighthouse budgets, desktop and mobile',
      'Contact form fails closed: Turnstile and rate limits',
    ],
    license: 'MIT',
    repo: 'https://github.com/n8watkins/n8builds-web',
    accent: 'cyan',
    action: { label: 'How it is built and tested', href: '/builds/n8builds', internal: true },
  },
  {
    name: 'portfolio.n8builds.dev',
    repoName: 'dev-portfolio',
    subtitle: 'My developer portfolio',
    description:
      'A Next.js portfolio with a page per project, live demo status read from OpenPing, and generated share cards. A clean start for a portfolio of your own.',
    images: [{ src: '/ads/dev-portfolio.webp', alt: "portfolio.n8builds.dev: Nathan Watkins' developer portfolio" }],
    tags: ['Next.js 16', 'Tailwind CSS', 'OpenPing status', 'OG images', 'Playwright', 'GitHub Actions'],
    points: ['Lint, types, unit tests, a build and Playwright on every PR', 'Demo status from the OpenPing feed'],
    license: 'MIT (code; my photos and write-ups stay mine)',
    repo: 'https://github.com/n8watkins/dev-portfolio',
    accent: 'teal',
    action: { label: 'Fork it on GitHub', href: 'https://github.com/n8watkins/dev-portfolio/fork' },
    liveSite: 'https://portfolio.n8builds.dev',
  },
]

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100'

/**
 * A subdomain site name may wrap after its first label on the narrowest
 * phones ("portfolio." / "n8builds.dev"), never inside a word.
 */
const SiteName = ({ name }: { name: string }) => {
  const dot = name.indexOf('.')
  if (name.split('.').length < 3) return name
  return (
    <>
      {name.slice(0, dot + 1)}
      <wbr />
      {name.slice(dot + 1)}
    </>
  )
}

const Engineering = ({ t }: { t: Template }) => {
  const accent = accents[t.accent]
  const Icon = accent.icon
  const actionClass = `${buttonBase} rounded-lg ${accent.primary}`
  return (
    <div role="group" aria-label={`How ${t.name} is engineered`} className={`mt-3 rounded-xl border bg-linear-to-br p-3.5 ${accent.box}`}>
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
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {t.action.internal ? (
          <Link href={t.action.href} className={actionClass}>
            <FiFileText className="h-3.5 w-3.5" aria-hidden="true" />
            {t.action.label}
          </Link>
        ) : (
          <a href={t.action.href} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <FiGitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            {t.action.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        <p className="text-xs text-slate-400">License: {t.license}</p>
      </div>
    </div>
  )
}

const TemplateRow = ({ t, flipped }: { t: Template; flipped: boolean }) => (
  <Reveal className={`flex flex-col ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-6 md:gap-12`}>
    <ProjectGallery title={t.name} images={t.images} imageClassName="object-cover object-top" />

    <div className="flex w-full flex-col md:w-1/2">
      <div className="flex items-center gap-3">
        {/* Both sites carry the same N8 brand mark (docs/DECISIONS.md). */}
        <Image src="/tab/n8-icon-192.png" alt="" width={44} height={44} className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11" />
        <div className="min-w-0">
          <h4 className="text-xl font-bold tracking-tight text-slate-50 [overflow-wrap:anywhere] sm:text-3xl">
            <SiteName name={t.name} />
          </h4>
          <p className="text-sm font-semibold text-blue-300">{t.subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{t.description}</p>
      <ul aria-label={`${t.name} is built with`} className="mt-2.5 flex flex-wrap gap-1.5">
        {t.tags.map((tag) => (
          <li key={tag} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400">
            {tag}
          </li>
        ))}
      </ul>
      <Engineering t={t} />

      {/* One line: no Details dialog here, so the row needs at most three buttons. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {t.liveSite && (
          <a
            href={t.liveSite}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400`}
          >
            <FiExternalLink className="h-3.5 w-3.5" />
            See it live<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        <StarButton href={t.repo} name={t.repoName} />
        <a
          href={t.repo}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8`}
        >
          <FiGithub className="h-3.5 w-3.5" />
          {t.repoName}
          <span className="sr-only"> on GitHub (opens in a new tab)</span>
        </a>
      </div>
    </div>
  </Reveal>
)

const UseAsTemplate = () => (
  <section id="open-source" aria-label="Open source templates" className="py-8">
    <Reveal>
      <LabSubheader
        title="Use my sites as templates"
        blurb="Both are public and open source. Fork either one, keep what helps, and make it yours."
      />
    </Reveal>
    <div className="flex flex-col gap-12 md:gap-16">
      {TEMPLATES.map((t, i) => (
        <TemplateRow key={t.name} t={t} flipped={i % 2 === 1} />
      ))}
    </div>
    <p className="mt-8 text-xs text-slate-450">
      This site&apos;s releases follow{' '}
      <a
        href="https://github.com/n8watkins/release-kit"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-cyan-200"
      >
        release-kit
      </a>
      , a release standard you can apply to any repo.
    </p>
  </section>
)

export default UseAsTemplate
