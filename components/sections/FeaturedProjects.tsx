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
 * Each row's ad takes its product's colour, so the four don't read as one
 * repeated box: Scribe's sky blue, OpenPing's uptime green, Solara's sun
 * orange, Portfolio Rank's leaderboard gold.
 */
const accents = {
  scribe: {
    box: 'border-sky-400/25 from-sky-500/[0.10] to-blue-600/[0.05]',
    primary: 'bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400',
    secondary: 'border-sky-400/30 text-sky-200',
    link: 'hover:text-sky-200',
    check: 'text-sky-300',
  },
  openping: {
    box: 'border-emerald-400/25 from-emerald-500/[0.09] to-cyan-500/[0.04]',
    primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
    secondary: 'border-emerald-400/35 text-emerald-200',
    link: 'hover:text-emerald-200',
    check: 'text-emerald-300',
  },
  solara: {
    box: 'border-orange-400/25 from-orange-500/[0.10] to-amber-400/[0.04]',
    // Mostly solid orange with a slight warm shift; orange into amber was too loud.
    primary: 'bg-linear-to-r from-orange-500 to-orange-400 text-slate-950 hover:from-orange-400 hover:to-orange-300',
    secondary: 'border-orange-400/35 text-orange-200',
    link: 'hover:text-orange-200',
    check: 'text-orange-300',
  },
  rank: {
    // Portfolio Rank's own accent, #fbbf24 (amber-400).
    box: 'border-amber-400/20 from-amber-400/[0.07] to-transparent',
    primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
    secondary: 'border-amber-400/35 text-amber-200',
    link: 'hover:text-amber-200',
    check: 'text-amber-300',
  },
} satisfies Record<string, { box: string; primary: string; secondary: string; link: string; check: string }>

interface AdLink {
  label: string
  href: string
  /** primary: the main action; secondary: an outlined button; link: a quiet text link. */
  kind: 'primary' | 'secondary' | 'link'
  /** Opens in a new tab. A link without it (a download) stays in this one. */
  external?: boolean
  /** Fetches a file from one of DOWNLOADS: shows a download mark, and what you get under it. */
  download?: keyof typeof DOWNLOADS
  /** Marks set right before a word of the label: { Windows: FaWindows } puts the logo by "Windows". */
  marks?: Record<string, IconType>
}

interface FeaturedProject {
  title: string
  /** The title as the product writes it (Portfolio Rank's gold "Rank"); reads the same as `title`. */
  wordmark?: React.ReactNode
  /** The app's own icon, shown left of its name. */
  icon: string
  /** Which part of the Lab: the owner's daily tools, or the featured builds. */
  group: 'tools' | 'featured'
  subtitle: string
  /** What it does, in a few sentences; the tech goes in `tags`, shown as pills. */
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
  /**
   * The row's ad: a few short points and the links that act on them. No link goes
   * where the row's Live Site or GitHub button already goes: each is a
   * different door (the download, the app itself, the install guide, the vote).
   * `compact` gives the box tighter padding (a single point and one button).
   */
  ad?: { points: string[]; accent: keyof typeof accents; compact?: boolean; links: AdLink[] }
}

// The owner's daily drivers first (Scribe and OpenPing run every day), then
// the showcase apps. n8builds itself is not a row: how it is built and tested
// is the "Use this as a template" section at the end of the homepage.
const featured: FeaturedProject[] = [
  {
    title: 'Scribe',
    icon: '/builds/scribe/icon.png',
    group: 'tools',
    subtitle: 'Private Local Dictation for Windows',
    description:
      "I dictate with Scribe every day. Hold a hotkey, talk, let go: the words land at your cursor in any app, transcribed on your own PC by a model kept loaded, so there's no wait.",
    images: [
      { src: '/builds/scribe/landing.webp', alt: 'Scribe: talk, it types. Private local dictation for Windows' },
      { src: '/builds/scribe/features.webp', alt: "Scribe's features: local Whisper models, a model picker, rebindable hotkeys and a floating status pill" },
    ],
    tags: ['Tauri', 'Rust', 'whisper.cpp', 'React'],
    github: 'https://github.com/n8watkins/scribe',
    liveSite: 'https://scribe.n8builds.dev',
    buildSlug: 'scribe',
    ad: {
      points: ['Free for Windows', 'No account', 'No telemetry', 'Voice stays local'],
      accent: 'scribe',
      links: [
        { label: 'Download for Windows', href: '/download/scribe', kind: 'primary', download: 'scribe', marks: { Windows: FaWindows } },
        {
          label: 'Want it on Mac or Linux? Ask for it',
          marks: { Mac: FaApple, Linux: FaLinux },
          href: 'https://github.com/n8watkins/scribe/issues/new?title=Request%3A%20Scribe%20for%20macOS%20or%20Linux&body=Which%20platform%20would%20you%20use%20Scribe%20on%20(macOS%20or%20Linux%2C%20and%20which%20version)%3F%0A%0AWhat%20would%20you%20use%20it%20for%3F',
          kind: 'link',
          external: true,
        },
      ],
    },
  },
  {
    title: 'OpenPing',
    icon: '/builds/openping/icon.svg',
    group: 'tools',
    subtitle: 'Uptime Monitoring in Your Own Cloudflare',
    description:
      'I check OpenPing every day: it watches my live demos. Uptime checks, incidents, alerts and status pages in your own Cloudflare account, with schedules so off-hours never count as downtime.',
    images: [
      { src: '/builds/openping/landing.webp', alt: 'OpenPing: uptime monitoring that runs entirely in your own cloud' },
      { src: '/builds/openping/status.webp', alt: 'An OpenPing public status page: all systems operational, with 90 days of uptime bars per service' },
      { src: '/builds/openping/tools.webp', alt: "OpenPing's free tools: is it down, uptime calculator, subnet calculator, cron tester, DNS and MX lookup" },
    ],
    tags: ['Cloudflare Workers', 'D1', 'Hono', 'React'],
    github: 'https://github.com/n8watkins/open-ping',
    liveSite: 'https://openping.n8builds.dev',
    buildSlug: 'openping',
    ad: {
      points: ['Free tools, no sign-up', 'Self-host free on Cloudflare'],
      accent: 'openping',
      links: [
        { label: 'Try the free tools', href: 'https://openping.n8builds.dev/tools', kind: 'primary', external: true },
        // The step-by-step install guide, not the landing page (that is Live Site).
        { label: 'Deploy your own', href: 'https://github.com/n8watkins/open-ping/blob/main/docs/INSTALL.md', kind: 'secondary', external: true },
      ],
    },
  },
  {
    title: 'Solara',
    icon: '/builds/solara/icon.png',
    group: 'featured',
    subtitle: 'Personal UV & Sun-Exposure Dashboard',
    description:
      'The UV index is a number, not an answer. Solara turns live UV data, your skin type, sunscreen and plans into safe sun windows for today and the days ahead, with calendar scheduling and push reminders.',
    // A wide social card: anchor left so the cover crop keeps the sun.
    images: [{ src: '/builds/solara/og-image.png', alt: 'Solara: know your sun window' }],
    imagePosition: 'object-left',
    tags: ['Next.js', 'Firebase', 'Stripe', 'Open-Meteo'],
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://solara-uv.web.app',
    buildSlug: 'solara',
    ad: {
      points: ['Free to use', 'No account to start'],
      accent: 'solara',
      // Straight into the planner; Live Site is the landing page.
      links: [{ label: 'Find your sun window', href: 'https://solara-uv.web.app/app/', kind: 'primary', external: true }],
    },
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
    subtitle: 'Developer Portfolio Ranker',
    description:
      'Nearly 2,000 developer portfolios, ranked by head-to-head votes: pick the better of two and an ELO rating sets the leaderboard. Each site gets a real screenshot, Lighthouse scores and an AI review.',
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
    ad: {
      points: ['A vote takes five seconds'],
      accent: 'rank',
      compact: true,
      links: [
        { label: 'Vote in a face-off', href: 'https://portfoliorank.vercel.app/rank', kind: 'primary', external: true },
        // The leaderboard's Browse section, where its "Submit yours" button sits.
        { label: 'Add your portfolio', href: 'https://portfoliorank.vercel.app/#browse', kind: 'link', external: true },
      ],
    },
  },
]

/** What the download button fetches, from the newest release; less when GitHub can't say. */
type DownloadFacts = Partial<Record<keyof typeof DOWNLOADS, string>>

async function downloadFacts(): Promise<DownloadFacts> {
  const facts: DownloadFacts = {}
  for (const app of Object.keys(DOWNLOADS) as (keyof typeof DOWNLOADS)[]) {
    const asset = await latestAsset(DOWNLOADS[app])
    // Scribe supports Windows 10 and 11, 64-bit only (its README).
    facts[app] = ['Installer (.exe) for Windows 10 and 11, 64-bit', ...(asset ? [asset.version, formatSize(asset.size)] : [])].join(' · ')
  }
  return facts
}

/** A link label as runs of plain text and marked words (each with its mark). */
function labelRuns(link: AdLink): { text: string; mark?: IconType }[] {
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

const buttonStill =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200'
const buttonBase = `${buttonStill} hover:scale-[1.02] motion-reduce:hover:scale-100`

const Ad = ({ project, facts }: { project: FeaturedProject; facts: DownloadFacts }) => {
  const ad = project.ad!
  const accent = accents[ad.accent]
  const buttons = ad.links.filter((l) => l.kind !== 'link')
  const links = ad.links.filter((l) => l.kind === 'link')
  const factsId = `${project.buildSlug}-download-facts`
  const underline = (kind: AdLink['kind']) =>
    kind === 'link' ? 'underline decoration-white/25 underline-offset-4' : undefined
  const renderLink = (link: AdLink) => {
    const underlineFor = underline(link.kind)
    const fact = link.download ? facts[link.download] : undefined
    return (
      <a
        key={link.href + link.label}
        href={link.href}
        {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...(fact ? { 'aria-describedby': factsId } : {})}
        className={
          link.kind === 'link'
            ? `group/link inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-300 ${accent.link}`
            : link.kind === 'primary'
              ? // The download button holds still on hover (the owner's call); the others lift a little.
                `${link.download ? buttonStill : buttonBase} rounded-lg ${accent.primary}`
              : `${buttonBase} rounded-lg border bg-white/4 hover:bg-white/8 ${accent.secondary}`
        }
      >
        {link.download ? <FiDownload className="h-4 w-4" aria-hidden="true" /> : null}
        <span>
          {labelRuns(link).map((run, i) =>
            run.mark ? (
              <span key={i} className="whitespace-nowrap">
                <run.mark
                  className={`mr-1 inline-block h-3.5 w-3.5 align-[-2px] ${link.kind === 'link' ? 'text-slate-400' : ''}`}
                  aria-hidden="true"
                />
                <span className={underlineFor}>{run.text}</span>
              </span>
            ) : (
              // The spaces at a run's ends stay out of a text link's underline, so
              // the underline never runs into the gap before a mark.
              <React.Fragment key={i}>
                {run.text.match(/^\s*/)?.[0]}
                <span className={underlineFor}>{run.text.trim()}</span>
                {run.text.match(/\s*$/)?.[0]}
              </React.Fragment>
            )
          )}
        </span>
        {link.external && link.kind !== 'link' ? <FiExternalLink className="h-3.5 w-3.5" /> : null}
        {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    )
  }
  const fact = ad.links.map((l) => (l.download ? facts[l.download] : undefined)).find(Boolean)
  // Short points, never wrapped: one per line, or two by two when there are
  // four (Scribe). If they don't fit beside the action, the list moves under it.
  const points = (
    <ul className={ad.points.length === 4 ? 'grid grid-cols-2 gap-x-5 gap-y-1' : 'flex flex-col gap-1'}>
      {ad.points.map((point) => (
        <li key={point} className="flex items-start gap-1.5 whitespace-nowrap text-sm font-semibold text-slate-100">
          <FiCheck className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${accent.check}`} aria-hidden="true" />
          {point}
        </li>
      ))}
    </ul>
  )
  // A link sits under the points when they are few, else under the whole box.
  const linksBeside = ad.points.length <= 2
  const linkRow = links.length > 0 && <div className="flex flex-wrap gap-x-4">{links.map(renderLink)}</div>
  // The action on the left, the points beside it on
  // the right, so the box stays short; where they don't fit (phones), they wrap under.
  return (
    <div
      role="group"
      aria-label={`Try ${project.title}`}
      data-accent={ad.accent}
      className={`mt-3 rounded-xl border bg-linear-to-br ${accent.box} ${ad.compact ? 'px-3 py-2.5' : 'p-3.5'}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* Never wider than the box, so the download caption wraps on phones. */}
        <div className="flex max-w-full shrink-0 items-start">
          <div className="flex min-w-0 flex-col items-start gap-2">
            {buttons.map(renderLink)}
            {/* What the download is, right under its button. */}
            {fact ? (
              <p id={factsId} className="-mt-0.5 text-xs text-slate-400">
                {fact}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {points}
          {linksBeside && linkRow}
        </div>
      </div>
      {!linksBeside && linkRow ? <div className="mt-2">{linkRow}</div> : null}
    </div>
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
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-[0.95rem] font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
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
            <h3 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{project.wordmark ?? project.title}</h3>
            <p className="text-sm font-semibold text-blue-300">{project.subtitle}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{project.description}</p>
        <ul aria-label={`${project.title} is built with`} className="mt-2.5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400">
              {tag}
            </li>
          ))}
        </ul>
        {project.credit && (
          <p className="mt-1.5 text-xs italic text-slate-450">
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
        {project.ad && <Ad project={project} facts={facts} />}

        {/* One row: Live Site, the Star | GitHub split button, Details. On phones,
            Live Site and Details share a line and the split button takes the next. */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {project.liveSite && (
            <a
              href={project.liveSite}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400`}
            >
              <FiExternalLink className="h-3.5 w-3.5" />
              Live Site<span className="sr-only"> of {project.title} (opens in a new tab)</span>
            </a>
          )}
          {project.github && <RepoButtons href={project.github} name={project.title} className="order-last col-span-2 sm:order-none" />}
          <ProjectDetails
            title={project.title}
            labelledBy={`${slugOf(project)}-details-title`}
            header={<DetailsHeader project={project} />}
            media={
              // Up to two screenshots, stacked, so the column fills beside the details.
              <div className="flex w-full flex-col gap-4">
                {project.images.slice(0, 2).map((image) => (
                  <Image
                    key={image.src}
                    src={image.src}
                    alt=""
                    width={1280}
                    height={800}
                    sizes="(max-width: 1024px) 45vw, 500px"
                    className={`aspect-16/10 w-full rounded-xl border border-white/8 object-cover ${project.imagePosition ?? 'object-top'}`}
                  />
                ))}
              </div>
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
          <div
            key={p.title}
            className={`lab-row-wash ${p.ad ? `lab-accent-${p.ad.accent}` : ''} py-6 md:py-8 ${flipped ? '[--lab-x:100%]' : '[--lab-x:0%]'}`}
          >
            <div className={container}>
              <ProjectRow project={p} flipped={flipped} facts={facts} />
            </div>
          </div>
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
        {/* Title-only subheaders get extra room under them, so the first row doesn't crowd them. */}
        <Reveal className={`${container} pb-4`}>
          <LabSubheader title="My daily drivers" />
        </Reveal>
        <Rows group="tools" offset={0} facts={facts} />
      </section>
      <section id="featured" aria-label="Featured builds" className="lab-accent-featured py-10">
        <Reveal className={`${container} pb-4`}>
          <LabSubheader title="Featured builds" />
        </Reveal>
        {/* Continue the left/right alternation from the rows above. */}
        <Rows group="featured" offset={tools} facts={facts} />
      </section>
    </>
  )
}

export default FeaturedProjects
