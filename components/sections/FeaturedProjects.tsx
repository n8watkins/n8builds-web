'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { FiGithub, FiExternalLink, FiFileText, FiDownload, FiStar, FiLayers, FiX } from 'react-icons/fi'
import { useReveal } from '@/hooks/useReveal'
import { useHydrated } from '@/hooks/useHydrated'
import Reveal from '@/components/ui/Reveal'
import TechStackCycle from '@/components/Projects/TechStackCycle'
import { projects } from '@/data/projects'
import LabSubheader from '@/components/sections/LabSubheader'

interface FeaturedProject {
  title: string
  /** The app's own icon, shown left of its name. */
  icon: string
  /** Which part of the Lab: the owner's daily tools, or the featured builds. */
  group: 'tools' | 'featured'
  subtitle: string
  description: string
  image: string
  images?: string[]
  tags: string[]
  github?: string
  liveSite?: string
  /** Its page on this site (/builds/<slug>), from data/builds.tsx. */
  buildSlug: string
  imageAlt: string
  /** object-position for the main image, when the top-centre crop cuts the art. */
  imagePosition?: string
  /** Who the build stands on, credited under the description. */
  credit?: { before: string; name: string; href: string; after?: string }
  /**
   * The row's ad: a one-line hook and the links that act on it (try it,
   * download it, add yours). The first is the primary button. A link without
   * `external` stays in this tab (a download).
   */
  ad?: { hook: string; ctas: { label: string; href: string; external?: boolean; download?: boolean }[] }
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
    image: '/builds/scribe/landing.webp',
    images: ['/builds/scribe/landing.webp', '/builds/scribe/features.webp'],
    imageAlt: 'Scribe: talk, it types. Private local dictation for Windows',
    tags: ['Tauri', 'Rust', 'Whisper'],
    github: 'https://github.com/n8watkins/scribe',
    liveSite: 'https://scribe.n8builds.dev',
    buildSlug: 'scribe',
    ad: {
      hook: 'Free for Windows. No account, no telemetry, and your voice never leaves your PC.',
      ctas: [
        { label: 'Download for Windows', href: '/download/scribe', download: true },
        { label: 'How it works', href: 'https://scribe.n8builds.dev', external: true },
        {
          label: 'Want it on Mac or Linux? Ask for it',
          href: 'https://github.com/n8watkins/scribe/issues/new?title=Request%3A%20Scribe%20for%20macOS%20or%20Linux&body=Which%20platform%20would%20you%20use%20Scribe%20on%20(macOS%20or%20Linux%2C%20and%20which%20version)%3F%0A%0AWhat%20would%20you%20use%20it%20for%3F',
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
    image: '/builds/openping/landing.webp',
    images: ['/builds/openping/landing.webp', '/builds/openping/status.webp', '/builds/openping/tools.webp'],
    imageAlt: 'OpenPing: uptime monitoring that runs entirely in your own cloud',
    tags: ['Cloudflare Workers', 'D1', 'React'],
    github: 'https://github.com/n8watkins/open-ping',
    liveSite: 'https://openping.n8builds.dev',
    buildSlug: 'openping',
    ad: {
      hook: 'Use the free tools now with no sign-up, or run your own monitor on Cloudflare\'s free plan.',
      ctas: [
        { label: 'Try the free tools', href: 'https://openping.n8builds.dev/tools', external: true },
        { label: 'Deploy your own', href: 'https://openping.n8builds.dev', external: true },
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
    image: '/builds/solara/og-image.png',
    imageAlt: 'Solara: know your sun window',
    // A wide social card: anchor left so the cover crop keeps the sun.
    imagePosition: 'object-left',
    tags: ['Next.js', 'Firebase', 'Stripe'],
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://solara-uv.web.app',
    buildSlug: 'solara',
    ad: {
      hook: 'Free to use, and no account needed to start.',
      ctas: [{ label: 'Find your sun window', href: 'https://solara-uv.web.app', external: true }],
    },
  },
  {
    title: 'Portfolio Rank',
    icon: '/builds/portfolio-rank/icon.png',
    group: 'featured',
    subtitle: 'Developer Portfolio Ranker',
    description:
      "Nearly 2,000 developer portfolios, ranked by head-to-head votes instead of the alphabet. A vote takes about five seconds: pick the better of two. Every site gets a real screenshot, Lighthouse scores and a Gemini review, and an ELO rating decides the leaderboard.",
    image: '/projects/PortfolioRank-1.png',
    images: ['/projects/PortfolioRank-1.png'],
    imageAlt: 'Portfolio Rank - developer portfolio ranker screenshot',
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
      hook: 'A vote takes five seconds. Have a portfolio? It could be next.',
      ctas: [
        { label: 'Vote in a face-off', href: 'https://portfoliorank.vercel.app/rank', external: true },
        { label: 'Add your portfolio', href: 'https://portfoliorank.vercel.app/', external: true },
      ],
    },
  },
]

/**
 * The row's detail view, in a native <dialog>: the tech stack and the way to
 * the full story, kept out of the row so the row stays short.
 */
const DetailsDialog = ({
  project,
  technologies,
  open,
  onClose,
}: {
  project: FeaturedProject
  technologies: ReturnType<typeof techFor>
  open: boolean
  onClose: () => void
}) => {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${slugOf(project)}-details-title`}
      onClose={onClose}
      // A click on the backdrop (the dialog element itself) closes it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-auto w-[min(42rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1220] p-0 text-slate-200 shadow-2xl shadow-black/60 opacity-0 transition-[opacity,translate,display,overlay] duration-200 transition-discrete translate-y-2 open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm motion-reduce:transition-none"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Image src={project.icon} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" unoptimized={project.icon.endsWith('.svg')} />
          <div className="min-w-0 flex-1">
            <h4 id={`${slugOf(project)}-details-title`} className="text-2xl font-bold tracking-tight text-slate-50">
              {project.title}
            </h4>
            <p className="mt-0.5 text-sm text-blue-300">{project.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

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
      </div>
    </dialog>
  )
}

const slugOf = (project: FeaturedProject) => project.buildSlug
const techFor = (project: FeaturedProject) => projects.find((p) => p.title === project.title)?.technologies

const ProjectRow = ({ project, flipped }: { project: FeaturedProject; flipped: boolean }) => {
  const technologies = techFor(project)
  const gallery = project.images && project.images.length > 1 ? project.images : [project.image]
  const [active, setActive] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const hydrated = useHydrated()
  const revealProps = useReveal()
  const current = gallery[Math.min(active, gallery.length - 1)]
  return (
  <motion.div
    {...revealProps}
    className={`flex flex-col ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 md:gap-14 items-center`}
  >
    {/* Image + gallery */}
    <div className="w-full md:w-1/2 shrink-0">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#07101d] aspect-16/10 group">
        <Image
          key={current}
          src={current}
          alt={project.imageAlt}
          fill
          className={`object-cover ${project.imagePosition ?? 'object-top'} transition-transform duration-500 group-hover:scale-[1.02]`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-darkBlue/40 to-transparent pointer-events-none" />
      </div>

      {/* Thumbnail strip */}
      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2">
          {gallery.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`${project.title} image ${i + 1}`}
              className={`relative aspect-16/10 w-full overflow-hidden rounded-lg border transition-all duration-200 ${
                i === active
                  ? 'border-cyan-400/60 ring-1 ring-cyan-400/40'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill className="object-cover object-top" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Content */}
    <div className="w-full md:w-1/2 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <Image
            src={project.icon}
            alt=""
            width={44}
            height={44}
            unoptimized={project.icon.endsWith('.svg')}
            className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-white/10"
          />
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">{project.title}</h3>
        </div>
        <p className="mt-2 mb-3 text-sm font-semibold text-blue-300">{project.subtitle}</p>
        <p className="text-[#9cadc5] text-sm sm:text-base/6 leading-relaxed">{project.description}</p>
        {project.credit && (
          <p className="mt-2 text-sm text-slate-450">
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
        {project.ad && (
          <div
            role="group"
            aria-label={`Try ${project.title}`}
            className="mt-4 rounded-xl border border-cyan-400/25 bg-linear-to-br from-cyan-500/[0.08] to-blue-600/[0.08] p-4"
          >
            <p className="text-sm font-semibold text-slate-100">{project.ad.hook}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {project.ad.ctas.map((cta, i) => (
                <a
                  key={cta.href + cta.label}
                  href={cta.href}
                  {...(cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={
                    i === 0
                      ? 'inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400'
                      : i === 1
                        ? 'inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-white/4 px-4 py-2 text-sm font-semibold text-cyan-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8'
                        : 'inline-flex items-center gap-1.5 px-1 py-2 text-sm font-semibold text-slate-300 underline decoration-white/25 underline-offset-4 hover:text-cyan-200'
                  }
                >
                  {cta.download ? <FiDownload className="h-4 w-4" aria-hidden="true" /> : null}
                  {cta.label}
                  {cta.external && i < 2 ? <FiExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  {cta.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Links: the live site and the code up front; the stack and the build log in Details */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {project.liveSite && (
          <a href={project.liveSite} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02]">
            <FiExternalLink className="w-3.5 h-3.5" />
            Live Site
          </a>
        )}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 bg-white/4 hover:bg-white/8 text-slate-300 font-semibold text-sm transition-all duration-200 hover:scale-[1.02]">
            <FiGithub className="w-3.5 h-3.5" />
            GitHub
          </a>
        )}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer"
            aria-label={`Star ${project.title} on GitHub (opens in a new tab)`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] hover:bg-amber-300/[0.12] text-amber-200 font-semibold text-sm transition-all duration-200 hover:scale-[1.02]">
            <FiStar className="w-3.5 h-3.5" />
            Star
          </a>
        )}
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          aria-haspopup="dialog"
          // Server-rendered: a click before hydration would be lost, so it stays
          // disabled until its handler exists (as Copy link and the contact form's Send).
          disabled={!hydrated}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 bg-white/4 hover:bg-white/8 text-slate-300 font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:cursor-wait">
          <FiLayers className="w-3.5 h-3.5" />
          Details
        </button>
      </div>
      <DetailsDialog project={project} technologies={technologies} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </div>
  </motion.div>
  )
}

const Rows = ({ group, offset }: { group: FeaturedProject['group']; offset: number }) => (
  <div className="flex flex-col gap-16 md:gap-20">
    {featured
      .filter((p) => p.group === group)
      .map((p, i) => (
        <ProjectRow key={p.title} project={p} flipped={(i + offset) % 2 === 1} />
      ))}
  </div>
)

/** The Lab's two rows of builds: the owner's daily tools, then the featured builds. */
const FeaturedProjects = () => {
  const tools = featured.filter((p) => p.group === 'tools').length
  return (
    <>
      <section id="my-tools" aria-label="Tools I use every day" className="py-10">
        <Reveal>
          <LabSubheader
            title="Tools I use every day"
            blurb="Mine first: I run both of these every day, and so can you."
          />
        </Reveal>
        <Rows group="tools" offset={0} />
      </section>
      <section id="featured" aria-label="Featured builds" className="py-10">
        <Reveal>
          <LabSubheader title="Featured builds" />
        </Reveal>
        {/* Continue the left/right alternation from the rows above. */}
        <Rows group="featured" offset={tools} />
      </section>
    </>
  )
}

export default FeaturedProjects
