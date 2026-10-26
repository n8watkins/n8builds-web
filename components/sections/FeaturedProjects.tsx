'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { FiGithub, FiExternalLink, FiFileText, FiDownload } from 'react-icons/fi'
import { useReveal } from '@/hooks/useReveal'
import Reveal from '@/components/ui/Reveal'
import TechStackCycle from '@/components/Projects/TechStackCycle'
import { projects } from '@/data/projects'
import LabSubheader from '@/components/sections/LabSubheader'

interface FeaturedProject {
  title: string
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
      ],
    },
  },
  {
    title: 'OpenPing',
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

const ProjectRow = ({ project, flipped }: { project: FeaturedProject; flipped: boolean }) => {
  const technologies = projects.find((p) => p.title === project.title)?.technologies
  const gallery = project.images && project.images.length > 1 ? project.images : [project.image]
  const [active, setActive] = useState(0)
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
        <p className="text-[0.7rem] font-bold tracking-[0.16em] uppercase text-blue-400 mb-2">{project.subtitle}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight mb-3">{project.title}</h3>
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
            <div className="mt-3 flex flex-wrap gap-2">
              {project.ad.ctas.map((cta, i) => (
                <a
                  key={cta.href + cta.label}
                  href={cta.href}
                  {...(cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={
                    i === 0
                      ? 'inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400'
                      : 'inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-white/4 px-4 py-2 text-sm font-semibold text-cyan-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8'
                  }
                >
                  {cta.download ? <FiDownload className="h-4 w-4" aria-hidden="true" /> : null}
                  {cta.label}
                  {cta.external ? <FiExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  {cta.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tech stack - interactive icon dock, falls back to flat tags */}
      {technologies ? (
        <TechStackCycle technologies={technologies} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {project.tags.map(tag => (
            <span key={tag}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
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
        <Link href={`/builds/${project.buildSlug}`} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 bg-white/4 hover:bg-white/8 text-slate-300 font-semibold text-sm transition-all duration-200 hover:scale-[1.02]">
          <FiFileText className="w-3.5 h-3.5" />
          Build log
        </Link>
      </div>
    </div>
  </motion.div>
  )
}

const FeaturedProjects = () => (
  <section id="featured" aria-label="Featured builds" className="py-10">
    <Reveal>
      <LabSubheader eyebrow="Featured" eyebrowClass="text-blue-400" title="Featured builds" />
    </Reveal>

    <div className="flex flex-col gap-16 md:gap-20">
      {featured.map((p, i) => (
        <ProjectRow key={p.title} project={p} flipped={i % 2 === 1} />
      ))}
    </div>
  </section>
)

export default FeaturedProjects
