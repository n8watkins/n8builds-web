import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6'
import { FiCheck, FiDownload, FiExternalLink, FiFileText, FiGithub } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import RepoButtons from '@/components/ui/RepoButtons'
import { ProjectDetails, ProjectGallery, type GalleryImage } from '@/components/sections/FeaturedProjectIslands'
import TechStackCycle from '@/components/Projects/TechStackCycle'
import { projects } from '@/data/projects'
import LabSubheader from '@/components/sections/LabSubheader'
import { DOWNLOADS, formatSize, latestAsset } from '@/lib/downloads'

/**
 * Each row's checks and main action take its product's colour, so the four
 * rows don't read as one repeated block: Scribe's sky blue, OpenPing's uptime
 * green, Solara's sun orange, Portfolio Rank's leaderboard gold. Every pairing
 * here passes WCAG AA: white on blue-600 or darker (5.2:1 and up), dark text on
 * the light fills, and the light accent tints on the dark page.
 */
const accents = {
  scribe: {
    // Near-solid blue: a slight shift into sky, darker on hover, so the white label stays above 5:1.
    primary: 'bg-linear-to-r from-blue-600 to-sky-700 text-white hover:from-blue-700 hover:to-sky-800',
    link: 'hover:text-sky-200',
    check: 'text-sky-300',
  },
  openping: {
    primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
    link: 'hover:text-emerald-200',
    check: 'text-emerald-300',
  },
  solara: {
    // Mostly solid orange with a slight warm shift; orange into amber was too loud.
    primary: 'bg-linear-to-r from-orange-500 to-orange-400 text-slate-950 hover:from-orange-400 hover:to-orange-300',
    link: 'hover:text-orange-200',
    check: 'text-orange-300',
  },
  rank: {
    // Portfolio Rank's own accent, #fbbf24 (amber-400).
    primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
    link: 'hover:text-amber-200',
    check: 'text-amber-300',
  },
} satisfies Record<string, { primary: string; link: string; check: string }>

interface ActionLink {
  label: string
  href: string
  /** primary: the product's main action, a button; link: a quiet text link under the features. */
  kind: 'primary' | 'link'
  /** Opens in a new tab. A link without it (a download) stays in this one. */
  external?: boolean
  /** Fetches a file from one of DOWNLOADS: shows a download mark, and what you get under it. */
  download?: keyof typeof DOWNLOADS
  /** Marks set right before a word of the label: { Windows: FaWindows } puts the logo by "Windows". */
  marks?: Record<string, IconType>
}

/** One of a row's features: plain text, or text that links somewhere. */
type Feature = string | { text: string; href: string }

interface FeaturedProject {
  title: string
  /** The title as the product writes it (Portfolio Rank's gold "Rank"); reads the same as `title`. */
  wordmark?: React.ReactNode
  /** The app's own icon, shown left of its name. */
  icon: string
  /** Which part of the Lab: the owner's daily tools, or the featured builds. */
  group: 'tools' | 'featured'
  /** A few words; the features carry the detail. */
  subtitle: string
  /** What it is, in about two lines; the features are the checks, the tech goes in `tags`. */
  description: string
  /** The screenshots, first one shown; the gallery steps through the rest. */
  images: GalleryImage[]
  tags: string[]
  github?: string
  liveSite?: string
  /** Its page on this site (/builds/<slug>), from data/builds.tsx. */
  buildSlug: string
  /** object-position for the images, when the top-centre crop cuts the art. */
  imagePosition?: string
  /** Who the build stands on, credited under the description. */
  credit?: { before: string; name: string; href: string; after?: string }
  /** The product's colour, for its checks and its main action. */
  accent: keyof typeof accents
  /**
   * What it actually does, shown as checks in its colour. The claims every row
   * shares (free, open source) live once, under the part's heading.
   */
  features: Feature[]
  /**
   * The product's main action (a button beside the tech pills) and any quiet
   * links (under the features). None goes where the row's Live Site or GitHub
   * button already goes: each is a different door (the download, the app
   * itself, the install guide, the vote).
   */
  actions: ActionLink[]
}

// The owner's daily drivers first (Scribe and OpenPing run every day), then
// the showcase apps. n8builds itself is not a row: how it is built and tested
// lives in the Lab's template part, right after these rows (UseAsTemplate.tsx).
// Features come from each project's README and live site.
const featured: FeaturedProject[] = [
  {
    title: 'Scribe',
    icon: '/builds/scribe/app-icon.png',
    group: 'tools',
    subtitle: 'Speech-to-text for Windows',
    description:
      'I dictate with Scribe every day: hold a hotkey, talk and let go, and your words land at the cursor, transcribed on your own PC.',
    images: [
      { src: '/builds/scribe/landing.webp', alt: 'Scribe: talk, it types. Private local dictation for Windows' },
      { src: '/builds/scribe/features.webp', alt: "Scribe's features: local Whisper models, a model picker, rebindable hotkeys and a floating status pill" },
    ],
    // Three pills, so the download fits on their line; the full stack is in Details.
    tags: ['Tauri', 'Rust', 'whisper.cpp'],
    github: 'https://github.com/n8watkins/scribe',
    liveSite: 'https://scribe.n8builds.dev',
    buildSlug: 'scribe',
    accent: 'scribe',
    features: ['Works in any app', 'Push-to-talk hotkey', 'Local Whisper models', 'Searchable history'],
    actions: [
      { label: 'Download for Windows', href: '/download/scribe', kind: 'primary', download: 'scribe', marks: { Windows: FaWindows } },
      {
        // Non-breaking spaces keep "Ask for it" together on the narrowest phones.
        label: 'Want it on Mac or Linux? Ask\u00a0for\u00a0it',
        marks: { Mac: FaApple, Linux: FaLinux },
        href: 'https://github.com/n8watkins/scribe/issues/new?title=Request%3A%20Scribe%20for%20macOS%20or%20Linux&body=Which%20platform%20would%20you%20use%20Scribe%20on%20(macOS%20or%20Linux%2C%20and%20which%20version)%3F%0A%0AWhat%20would%20you%20use%20it%20for%3F',
        kind: 'link',
        external: true,
      },
    ],
  },
  {
    title: 'OpenPing',
    icon: '/builds/openping/icon.svg',
    group: 'tools',
    subtitle: 'Self-hosted uptime monitoring',
    description:
      'I check OpenPing every day: it watches my live demos from my own Cloudflare account, and off-hours never count as downtime.',
    images: [
      { src: '/builds/openping/landing.webp', alt: 'OpenPing: uptime monitoring that runs entirely in your own cloud' },
      { src: '/builds/openping/status.webp', alt: 'An OpenPing public status page: all systems operational, with 90 days of uptime bars per service' },
      { src: '/builds/openping/tools.webp', alt: "OpenPing's free tools: is it down, uptime calculator, subnet calculator, cron tester, DNS and MX lookup" },
    ],
    tags: ['Cloudflare Workers', 'D1', 'Hono', 'React'],
    github: 'https://github.com/n8watkins/open-ping',
    liveSite: 'https://openping.n8builds.dev',
    buildSlug: 'openping',
    accent: 'openping',
    features: ['Schedule-aware checks', 'Public status pages', 'Incident alerts', 'Five monitor types'],
    actions: [
      { label: 'Try the free tools', href: 'https://openping.n8builds.dev/tools', kind: 'primary', external: true },
      // The step-by-step install guide, not the landing page (that is Live Site).
      { label: 'Deploy your own', href: 'https://github.com/n8watkins/open-ping/blob/main/docs/INSTALL.md', kind: 'link', external: true },
    ],
  },
  {
    title: 'Solara',
    icon: '/builds/solara/icon.png',
    group: 'featured',
    subtitle: 'Personal UV planner',
    description:
      'The UV index is a number, not an answer. Solara turns live UV, your skin type and your sunscreen into safe sun windows.',
    // A wide social card: anchor left so the cover crop keeps the sun.
    images: [{ src: '/builds/solara/og-image.png', alt: 'Solara: know your sun window' }],
    imagePosition: 'object-left',
    tags: ['Next.js', 'Firebase', 'Open-Meteo'],
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://solara-uv.web.app',
    buildSlug: 'solara',
    accent: 'solara',
    features: ['Personalised sun windows', 'Google Calendar scheduling', 'Push reminders', 'Today and the days ahead'],
    // Straight into the planner; Live Site is the landing page.
    actions: [{ label: 'Find your sun window', href: 'https://solara-uv.web.app/app/', kind: 'primary', external: true }],
  },
  {
    title: 'Portfolio Rank',
    wordmark: (
      <>
        Portfolio <span className="text-[#fbbf24]">Rank</span>
      </>
    ),
    icon: '/builds/portfolio-rank/icon.png',
    group: 'featured',
    subtitle: 'The developer portfolio leaderboard',
    description:
      '1,700+ developer portfolios, ranked by head-to-head votes instead of A to Z, with a real screenshot of every site.',
    images: [{ src: '/projects/PortfolioRank-1.png', alt: 'Portfolio Rank - developer portfolio ranker screenshot' }],
    tags: ['Next.js', 'Gemini', 'Turso', 'Vercel'],
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.vercel.app/',
    buildSlug: 'portfolio-rank',
    credit: {
      before: 'Built on',
      name: "Emma Bostian's developer-portfolios list",
      href: 'https://github.com/emmabostian/developer-portfolios',
      after: ', curated by thousands.',
    },
    accent: 'rank',
    features: [
      'Head-to-head voting',
      'ELO leaderboard',
      'Lighthouse and AI reviews',
      // The leaderboard's Browse section, where its "Submit yours" button sits.
      { text: 'Add your portfolio and see how you compare', href: 'https://portfoliorank.vercel.app/#browse' },
    ],
    actions: [{ label: 'Vote in a face-off', href: 'https://portfoliorank.vercel.app/rank', kind: 'primary', external: true }],
  },
]

/** What the download button fetches, from the newest release; less when GitHub can't say. */
type DownloadFacts = Partial<Record<keyof typeof DOWNLOADS, string>>

async function downloadFacts(): Promise<DownloadFacts> {
  const facts: DownloadFacts = {}
  for (const app of Object.keys(DOWNLOADS) as (keyof typeof DOWNLOADS)[]) {
    const asset = await latestAsset(DOWNLOADS[app])
    // Scribe supports Windows 10 and 11, 64-bit only (its README).
    facts[app] = ['Windows 10 and 11, 64-bit', ...(asset ? [asset.version, formatSize(asset.size)] : [])].join(' · ')
  }
  return facts
}

/** A link label as runs of plain text and marked words (each with its mark). */
function labelRuns(link: ActionLink): { text: string; mark?: IconType }[] {
  const runs: { text: string; mark?: IconType }[] = []
  for (const token of link.label.split(/(\s+)/)) {
    const mark = link.marks?.[token.replace(/[^\w]/g, '')]
    const last = runs[runs.length - 1]
    if (mark) runs.push({ text: token, mark })
    else if (last && !last.mark) last.text += token
    else runs.push({ text: token })
  }
  return runs
}

/** A Lab button. None of them grows on hover: the row's buttons sit level. */
const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200'

const ActionLinkView = ({ project, link, facts }: { project: FeaturedProject; link: ActionLink; facts: DownloadFacts }) => {
  const accent = accents[project.accent]
  const fact = link.download ? facts[link.download] : undefined
  const isLink = link.kind === 'link'
  return (
    <a
      href={link.href}
      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...(fact ? { 'aria-describedby': `${project.buildSlug}-download-facts` } : {})}
      className={
        isLink
          ? `inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-300 transition-colors ${accent.link}`
          : `${buttonBase} btn-shimmer rounded-lg px-3.5 ${accent.primary}`
      }
    >
      {link.download ? <FiDownload className="h-4 w-4" aria-hidden="true" /> : null}
      {/* A text link's underline is one line under its whole label, marks included
          (a bottom border: a text underline would break at each mark). */}
      <span className={isLink ? 'border-b border-white/30 pb-px' : undefined}>
        {labelRuns(link).map((run, i) =>
          run.mark ? (
            <span key={i} className="whitespace-nowrap">
              <run.mark className={`mr-1 inline-block h-3.5 w-3.5 align-[-2px] ${isLink ? 'text-slate-400' : ''}`} aria-hidden="true" />
              {run.text}
            </span>
          ) : (
            <React.Fragment key={i}>{run.text}</React.Fragment>
          )
        )}
      </span>
      {link.external && !isLink ? <FiExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  )
}

/** The row's main action, beside its tech pills; a download carries its caption close under it. */
const PrimaryAction = ({ project, facts }: { project: FeaturedProject; facts: DownloadFacts }) => {
  const link = project.actions.find((a) => a.kind === 'primary')
  if (!link) return null
  const fact = link.download ? facts[link.download] : undefined
  return (
    <div className="flex max-w-full flex-col items-start gap-1">
      <ActionLinkView project={project} link={link} facts={facts} />
      {fact ? (
        <p id={`${project.buildSlug}-download-facts`} className="text-xs text-slate-400">
          {fact}
        </p>
      ) : null}
    </div>
  )
}

/** What the project does, as checks in its colour, two by two from small screens up. */
const Features = ({ project }: { project: FeaturedProject }) => {
  const accent = accents[project.accent]
  return (
    <ul aria-label={`What ${project.title} does`} className="mt-4 grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
      {project.features.map((feature) => {
        const text = typeof feature === 'string' ? feature : feature.text
        return (
          // A linked feature is a sentence, so it takes the whole line.
          <li key={text} className={`flex items-start gap-2 text-sm font-medium text-slate-200 ${typeof feature === 'string' ? '' : 'sm:col-span-2'}`}>
            <FiCheck className={`mt-[3px] h-4 w-4 shrink-0 ${accent.check}`} aria-hidden="true" />
            {typeof feature === 'string' ? (
              text
            ) : (
              <a
                href={feature.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline decoration-white/30 underline-offset-4 transition-colors ${accent.link}`}
              >
                {text}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The row's detail view: the tech stack and the way to the full story, kept
 * out of the row so the row stays short. Rendered here on the server; the
 * Details button and its native <dialog> are an island (ProjectDetails).
 */
const DetailsBody = ({ project, technologies }: { project: FeaturedProject; technologies: ReturnType<typeof techFor> }) => (
  <>
    <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-slate-450">How it&apos;s built</p>
    <div className="mt-4">
      {technologies ? (
        <TechStackCycle technologies={technologies} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-semibold text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="mt-8 flex flex-wrap gap-3 border-t border-white/8 pt-6">
      <Link
        href={`/builds/${project.buildSlug}`}
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-700 px-5 py-2.5 text-[0.95rem] font-semibold text-white transition-colors duration-200 hover:from-blue-700 hover:to-cyan-800"
      >
        <FiFileText className="h-4 w-4 shrink-0" aria-hidden="true" />
        Full story and build log
      </Link>
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-5 py-2.5 text-[0.95rem] font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
        >
          <FiGithub className="h-4 w-4 shrink-0" aria-hidden="true" />
          Source
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  </>
)

const DetailsHeader = ({ project }: { project: FeaturedProject }) => (
  <>
    <Image
      src={project.icon}
      alt=""
      width={56}
      height={56}
      className="h-14 w-14 shrink-0 rounded-2xl ring-1 ring-white/10"
      unoptimized={project.icon.endsWith('.svg')}
    />
    <div className="min-w-0 flex-1">
      <h4 id={`${slugOf(project)}-details-title`} className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
        {project.wordmark ?? project.title}
      </h4>
      <p className="mt-1 text-base font-medium text-blue-300">{project.subtitle}</p>
    </div>
  </>
)

const slugOf = (project: FeaturedProject) => project.buildSlug
const techFor = (project: FeaturedProject) => projects.find((p) => p.title === project.title)?.technologies

const ProjectRow = ({ project, flipped, facts }: { project: FeaturedProject; flipped: boolean; facts: DownloadFacts }) => {
  const technologies = techFor(project)
  return (
    <Reveal className={`flex flex-col ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-6 md:gap-12`}>
      <ProjectGallery
        title={project.title}
        images={project.images}
        imageClassName={`object-cover ${project.imagePosition ?? 'object-top'} transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none`}
      />

      <div className="flex w-full flex-col md:w-1/2">
        <div className="flex items-center gap-3">
          <Image
            src={project.icon}
            alt=""
            width={44}
            height={44}
            unoptimized={project.icon.endsWith('.svg')}
            className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11"
          />
          <div className="min-w-0">
            <h3 id={`${slugOf(project)}-title`} className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              {project.wordmark ?? project.title}
            </h3>
            <p className="text-sm font-semibold text-blue-300">{project.subtitle}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{project.description}</p>
        {/* The tech as pills, with the product's main action on the same line. */}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
          <ul aria-label={`${project.title} is built with`} className="flex flex-wrap gap-1.5 py-1">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs text-slate-300">
                {tag}
              </li>
            ))}
          </ul>
          <PrimaryAction project={project} facts={facts} />
        </div>
        {project.credit && (
          <p className="mt-2 text-xs italic text-slate-400">
            {project.credit.before}{' '}
            <a
              href={project.credit.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 underline decoration-white/25 underline-offset-4 hover:text-cyan-200"
            >
              {project.credit.name}
            </a>
            {project.credit.after}
          </p>
        )}
        <Features project={project} />
        {project.actions.some((a) => a.kind === 'link') && (
          <div className="mt-2.5 flex flex-wrap gap-x-5">
            {project.actions
              .filter((a) => a.kind === 'link')
              .map((link) => (
                <ActionLinkView key={link.href} project={project} link={link} facts={facts} />
              ))}
          </div>
        )}

        {/* One row across the column: Live Site, the Star | GitHub split button,
            Details, in even thirds. On phones, Live Site and Details share a line
            and the split button takes the next. */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {project.liveSite && (
            <a
              href={project.liveSite}
              target="_blank"
              rel="noopener noreferrer"
              // Blue into a dark cyan, so the white label passes AA across the whole button.
              className={`${buttonBase} bg-linear-to-r from-blue-600 to-cyan-700 text-white hover:from-blue-700 hover:to-cyan-800`}
            >
              <FiExternalLink className="h-3.5 w-3.5" />
              Live Site<span className="sr-only"> of {project.title} (opens in a new tab)</span>
            </a>
          )}
          {project.github && (
            <RepoButtons href={project.github} name={project.title} className="order-last col-span-2 w-full sm:order-none sm:col-span-1" />
          )}
          <ProjectDetails
            title={project.title}
            labelledBy={`${slugOf(project)}-details-title`}
            header={<DetailsHeader project={project} />}
            media={
              // The row's gallery again, one screenshot at a time, at the dialog's width.
              <ProjectGallery
                title={project.title}
                images={project.images}
                className="w-full"
                sizes="(max-width: 1024px) 45vw, 500px"
                imageClassName={`object-cover ${project.imagePosition ?? 'object-top'}`}
              />
            }
          >
            <DetailsBody project={project} technologies={technologies} />
          </ProjectDetails>
        </div>
      </div>
    </Reveal>
  )
}

/** The Lab's content width, inside its full-bleed part and row washes. */
const container = 'mx-auto max-w-6xl px-5 sm:px-8'

// Each row sits in its own full-bleed wash in its product's colour, a glow from
// the page edge on its screenshot's side (`.lab-row-wash` in app/globals.css). The
// washes fade out at their edges, so the rows' padding doubles as the gap between them.
const Rows = ({ group, offset, facts }: { group: FeaturedProject['group']; offset: number; facts: DownloadFacts }) => (
  <div className="flex flex-col">
    {featured
      .filter((p) => p.group === group)
      .map((p, i) => {
        // Screenshot right for Scribe (text first), then alternating down the Lab.
        const flipped = (i + offset) % 2 === 0
        return (
          // An article named by its title, so each row is one landmark-like unit for screen readers.
          <article
            key={p.title}
            aria-labelledby={`${slugOf(p)}-title`}
            className={`lab-row-wash lab-accent-${p.accent} py-6 md:py-8 ${flipped ? '[--lab-x:100%]' : '[--lab-x:0%]'}`}
          >
            <div className={container}>
              <ProjectRow project={p} flipped={flipped} facts={facts} />
            </div>
          </article>
        )
      })}
  </div>
)

/** The Lab's two rows of builds: the owner's daily tools, then the featured builds. */
const FeaturedProjects = async () => {
  const tools = featured.filter((p) => p.group === 'tools').length
  const facts = await downloadFacts()
  return (
    <>
      <section id="my-tools" aria-label="My daily drivers" className="lab-accent-tools py-10">
        <Reveal className={`${container} pb-4`}>
          <LabSubheader title="My daily drivers" blurb="Free and open source: use them, self-host them or fork them." />
        </Reveal>
        <Rows group="tools" offset={0} facts={facts} />
      </section>
      <section id="featured" aria-label="Featured builds" className="lab-accent-featured mt-10 py-10 md:mt-16">
        <Reveal className={`${container} pb-4`}>
          <LabSubheader title="Featured builds" blurb="Free to use and open source, with no sign-up to start." />
        </Reveal>
        {/* Continue the left/right alternation from the rows above. */}
        <Rows group="featured" offset={tools} facts={facts} />
      </section>
    </>
  )
}

export default FeaturedProjects
