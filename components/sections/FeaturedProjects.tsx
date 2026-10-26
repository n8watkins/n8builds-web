import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import { FaWindows } from 'react-icons/fa6'
import { FiActivity, FiBarChart2, FiExternalLink, FiFileText, FiGithub, FiMic, FiSun } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import StarButton from '@/components/ui/StarButton'
import { ProjectDetails, ProjectGallery, type GalleryImage } from '@/components/sections/FeaturedProjectIslands'
import TechStackCycle from '@/components/Projects/TechStackCycle'
import { projects } from '@/data/projects'
import LabSubheader from '@/components/sections/LabSubheader'
import { DOWNLOADS, formatSize, latestAsset } from '@/lib/downloads'

/**
 * Each row's ad takes its product's colour and mark, so the four don't read as
 * one repeated box: Scribe's sky blue and microphone, OpenPing's uptime green
 * and pulse, Solara's sun orange, Portfolio Rank's leaderboard gold.
 */
const accents = {
  scribe: {
    icon: FiMic,
    box: 'border-sky-400/25 from-sky-500/[0.10] to-blue-600/[0.05]',
    chip: 'bg-sky-400/15 text-sky-300 ring-sky-300/25',
    primary: 'bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400',
    secondary: 'border-sky-400/30 text-sky-200',
    link: 'hover:text-sky-200',
  },
  openping: {
    icon: FiActivity,
    box: 'border-emerald-400/25 from-emerald-500/[0.09] to-cyan-500/[0.04]',
    chip: 'bg-emerald-400/15 text-emerald-300 ring-emerald-300/25',
    primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
    secondary: 'border-emerald-400/35 text-emerald-200',
    link: 'hover:text-emerald-200',
  },
  solara: {
    icon: FiSun,
    box: 'border-orange-400/25 from-orange-500/[0.10] to-amber-400/[0.04]',
    chip: 'bg-orange-400/15 text-orange-300 ring-orange-300/25',
    primary: 'bg-linear-to-r from-orange-500 to-amber-400 text-slate-950 hover:from-orange-400 hover:to-amber-300',
    secondary: 'border-orange-400/35 text-orange-200',
    link: 'hover:text-orange-200',
  },
  rank: {
    icon: FiBarChart2,
    box: 'border-yellow-400/20 from-yellow-400/[0.07] to-transparent',
    chip: 'bg-yellow-400/15 text-yellow-300 ring-yellow-300/25',
    primary: 'bg-yellow-400 text-slate-950 hover:bg-yellow-300',
    secondary: 'border-yellow-400/35 text-yellow-200',
    link: 'hover:text-yellow-200',
  },
} satisfies Record<string, { icon: IconType; box: string; chip: string; primary: string; secondary: string; link: string }>

interface AdLink {
  label: string
  href: string
  /** primary: the main action; secondary: an outlined button; link: a quiet text link. */
  kind: 'primary' | 'secondary' | 'link'
  /** Opens in a new tab. A link without it (a download) stays in this one. */
  external?: boolean
  /** Fetches a file from one of DOWNLOADS: shows a Windows mark and what you get. */
  download?: keyof typeof DOWNLOADS
}

interface FeaturedProject {
  title: string
  /** The app's own icon, shown left of its name. */
  icon: string
  /** Which part of the Lab: the owner's daily tools, or the featured builds. */
  group: 'tools' | 'featured'
  subtitle: string
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
   * The row's ad: a one-line hook and the links that act on it. No link goes
   * where the row's Live Site or GitHub button already goes: each is a
   * different door (the download, the app itself, the install guide, the vote).
   * `compact` sets hook and buttons on one line (the tightest row).
   */
  ad?: { hook: string; accent: keyof typeof accents; compact?: boolean; links: AdLink[] }
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
      'I dictate with Scribe every day. Hold a hotkey, talk, release: whisper.cpp transcribes on your own PC and the words land at your cursor, in any app. A Tauri and Rust app keeps the model warm in memory, so the text is ready the moment you let go. No cloud, no account, no subscription.',
    images: [
      { src: '/builds/scribe/landing.webp', alt: 'Scribe: talk, it types. Private local dictation for Windows' },
      { src: '/builds/scribe/features.webp', alt: "Scribe's features: local Whisper models, a model picker, rebindable hotkeys and a floating status pill" },
    ],
    tags: ['Tauri', 'Rust', 'Whisper'],
    github: 'https://github.com/n8watkins/scribe',
    liveSite: 'https://scribe.n8builds.dev',
    buildSlug: 'scribe',
    ad: {
      hook: 'Free for Windows. No account, no telemetry, and your voice never leaves your PC.',
      accent: 'scribe',
      links: [
        { label: 'Download for Windows', href: '/download/scribe', kind: 'primary', download: 'scribe' },
        {
          label: 'Want it on Mac or Linux? Ask for it',
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
      'I check OpenPing every day: it watches my live demos. Uptime checks, incidents and public status pages run on a Cloudflare Worker and D1 in your own account, inside the free plan. Schedule-aware: apps are watched only when they matter, and off-hours never count as downtime.',
    images: [
      { src: '/builds/openping/landing.webp', alt: 'OpenPing: uptime monitoring that runs entirely in your own cloud' },
      { src: '/builds/openping/status.webp', alt: 'An OpenPing public status page: all systems operational, with 90 days of uptime bars per service' },
      { src: '/builds/openping/tools.webp', alt: "OpenPing's free tools: is it down, uptime calculator, subnet calculator, cron tester, DNS and MX lookup" },
    ],
    tags: ['Cloudflare Workers', 'D1', 'React'],
    github: 'https://github.com/n8watkins/open-ping',
    liveSite: 'https://openping.n8builds.dev',
    buildSlug: 'openping',
    ad: {
      hook: "Use the free tools now with no sign-up, or run your own monitor on Cloudflare's free plan.",
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
      'The UV index is a number, not an answer. Solara turns live UV data, your skin type, sunscreen and activities into safe sun windows for today and the days ahead, with calendar scheduling and push reminders. An installable Next.js app on Firebase, free to use, and no account needed to start.',
    // A wide social card: anchor left so the cover crop keeps the sun.
    images: [{ src: '/builds/solara/og-image.png', alt: 'Solara: know your sun window' }],
    imagePosition: 'object-left',
    tags: ['Next.js', 'Firebase', 'Stripe'],
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://solara-uv.web.app',
    buildSlug: 'solara',
    ad: {
      hook: 'Free to use, and no account needed to start.',
      accent: 'solara',
      // Straight into the planner; Live Site is the landing page.
      links: [{ label: 'Find your sun window', href: 'https://solara-uv.web.app/app/', kind: 'primary', external: true }],
    },
  },
  {
    title: 'Portfolio Rank',
    icon: '/builds/portfolio-rank/icon.png',
    group: 'featured',
    subtitle: 'Developer Portfolio Ranker',
    description:
      "Nearly 2,000 developer portfolios, ranked by head-to-head votes instead of the alphabet. A vote takes about five seconds: pick the better of two. Every site gets a real screenshot, Lighthouse scores and a Gemini review, and an ELO rating decides the leaderboard.",
    images: [{ src: '/projects/PortfolioRank-1.png', alt: 'Portfolio Rank - developer portfolio ranker screenshot' }],
    tags: ['Next.js', 'TypeScript', 'Vercel'],
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.vercel.app/',
    buildSlug: 'portfolio-rank',
    credit: {
      before: 'Built on',
      name: "Emma Bostian's developer-portfolios list",
      href: 'https://github.com/emmabostian/developer-portfolios',
      after: ', curated by thousands of contributors.',
    },
    ad: {
      hook: 'A vote takes five seconds.',
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
    facts[app] = ['Windows installer (.exe)', ...(asset ? [asset.version, formatSize(asset.size)] : [])].join(' · ')
  }
  return facts
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100'

const Ad = ({ project, facts }: { project: FeaturedProject; facts: DownloadFacts }) => {
  const ad = project.ad!
  const accent = accents[ad.accent]
  const Icon = accent.icon
  const buttons = ad.links.filter((l) => l.kind !== 'link')
  const links = ad.links.filter((l) => l.kind === 'link')
  const factsId = `${project.buildSlug}-download-facts`
  const renderLink = (link: AdLink) => {
    const fact = link.download ? facts[link.download] : undefined
    return (
      <a
        key={link.href + link.label}
        href={link.href}
        {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...(fact ? { 'aria-describedby': factsId } : {})}
        className={
          link.kind === 'link'
            ? `inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-300 underline decoration-white/25 underline-offset-4 ${accent.link}`
            : link.kind === 'primary'
              ? `${buttonBase} rounded-lg ${accent.primary}`
              : `${buttonBase} rounded-lg border bg-white/4 hover:bg-white/8 ${accent.secondary}`
        }
      >
        {link.download ? <FaWindows className="h-3.5 w-3.5" /> : null}
        {link.label}
        {link.external && link.kind !== 'link' ? <FiExternalLink className="h-3.5 w-3.5" /> : null}
        {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    )
  }
  const fact = ad.links.map((l) => (l.download ? facts[l.download] : undefined)).find(Boolean)
  const chip = (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${accent.chip}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
  return (
    <div
      role="group"
      aria-label={`Try ${project.title}`}
      data-accent={ad.accent}
      className={`mt-3 rounded-xl border bg-linear-to-br ${accent.box} ${ad.compact ? 'px-3 py-2.5' : 'p-3.5'}`}
    >
      {ad.compact ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5">
            {chip}
            <p className="text-sm font-semibold text-slate-100">{ad.hook}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {buttons.map(renderLink)}
            {links.map(renderLink)}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2.5">
            {chip}
            <p className="pt-0.5 text-sm font-semibold text-slate-100">{ad.hook}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {buttons.map(renderLink)}
            {fact ? (
              <p id={factsId} className="text-xs text-slate-400">
                {fact}
              </p>
            ) : null}
          </div>
          {links.length > 0 && <div className="mt-1.5 flex flex-wrap gap-x-4">{links.map(renderLink)}</div>}
        </>
      )}
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
    <p className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">How it&apos;s built</p>
    <div className="mt-3">
      {technologies ? (
        <TechStackCycle technologies={technologies} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="mt-8 flex flex-wrap gap-3 border-t border-white/8 pt-6">
      <Link
        href={`/builds/${project.buildSlug}`}
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
      >
        <FiFileText className="h-3.5 w-3.5" />
        Full story and build log
      </Link>
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
        >
          <FiGithub className="h-3.5 w-3.5" />
          Source
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  </>
)

const DetailsHeader = ({ project }: { project: FeaturedProject }) => (
  <>
    <Image src={project.icon} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" unoptimized={project.icon.endsWith('.svg')} />
    <div className="min-w-0 flex-1">
      <h4 id={`${slugOf(project)}-details-title`} className="text-2xl font-bold tracking-tight text-slate-50">
        {project.title}
      </h4>
      <p className="mt-0.5 text-sm text-blue-300">{project.subtitle}</p>
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
            <h3 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{project.title}</h3>
            <p className="text-sm font-semibold text-blue-300">{project.subtitle}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{project.description}</p>
        {project.credit && (
          <p className="mt-1.5 text-sm text-slate-450">
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

        {/* Two by two: try it and star it on top; the code and the details below. */}
        <div className="mt-4 grid max-w-sm grid-cols-2 gap-2">
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
          {project.github && <StarButton href={project.github} name={project.title} />}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8`}
            >
              <FiGithub className="h-3.5 w-3.5" />
              GitHub<span className="sr-only"> repository of {project.title} (opens in a new tab)</span>
            </a>
          )}
          <ProjectDetails title={project.title} labelledBy={`${slugOf(project)}-details-title`} header={<DetailsHeader project={project} />}>
            <DetailsBody project={project} technologies={technologies} />
          </ProjectDetails>
        </div>
      </div>
    </Reveal>
  )
}

const Rows = ({ group, offset, facts }: { group: FeaturedProject['group']; offset: number; facts: DownloadFacts }) => (
  <div className="flex flex-col gap-12 md:gap-16">
    {featured
      .filter((p) => p.group === group)
      .map((p, i) => (
        <ProjectRow key={p.title} project={p} flipped={(i + offset) % 2 === 1} facts={facts} />
      ))}
  </div>
)

/** The Lab's two rows of builds: the owner's daily tools, then the featured builds. */
const FeaturedProjects = async () => {
  const tools = featured.filter((p) => p.group === 'tools').length
  const facts = await downloadFacts()
  return (
    <>
      <section id="my-tools" aria-label="Tools I use every day" className="py-8">
        <Reveal>
          <LabSubheader title="Tools I use every day" blurb="Mine first: I run both of these every day, and so can you." />
        </Reveal>
        <Rows group="tools" offset={0} facts={facts} />
      </section>
      <section id="featured" aria-label="Featured builds" className="py-8">
        <Reveal>
          <LabSubheader title="Featured builds" />
        </Reveal>
        {/* Continue the left/right alternation from the rows above. */}
        <Rows group="featured" offset={tools} facts={facts} />
      </section>
    </>
  )
}

export default FeaturedProjects
