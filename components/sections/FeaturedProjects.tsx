'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { FiGithub, FiExternalLink, FiFileText } from 'react-icons/fi'
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
}

// The owner's daily drivers first (Scribe and OpenPing run every day), then
// the showcase apps. n8builds itself is not a row: how it is built and tested
// is the "Use this as a template" section at the end of the homepage.
const featured: FeaturedProject[] = [
  {
    title: 'Scribe',
    subtitle: 'Private Local Dictation for Windows',
    description:
      'Hold a hotkey, talk, release: whisper.cpp transcribes on your own PC and the words land at your cursor, in any app. No cloud, no account, no subscription. I dictate with it every day.',
    image: '/builds/scribe/landing.webp',
    images: ['/builds/scribe/landing.webp', '/builds/scribe/features.webp'],
    imageAlt: 'Scribe: talk, it types. Private local dictation for Windows',
    tags: ['Tauri', 'Rust', 'Whisper'],
    github: 'https://github.com/n8watkins/scribe',
    liveSite: 'https://scribe.n8builds.dev',
    buildSlug: 'scribe',
  },
  {
    title: 'OpenPing',
    subtitle: 'Uptime Monitoring in Your Own Cloudflare',
    description:
      'Uptime checks, incidents and public status pages that deploy into your own Cloudflare account, on the free plan. Schedule-aware: apps are watched only when they matter, and off-hours never count as downtime. I use it daily to watch my live demos, and its free tools need no sign-up.',
    image: '/builds/openping/landing.webp',
    images: ['/builds/openping/landing.webp', '/builds/openping/status.webp', '/builds/openping/tools.webp'],
    imageAlt: 'OpenPing: uptime monitoring that runs entirely in your own cloud',
    tags: ['Cloudflare Workers', 'D1', 'React'],
    github: 'https://github.com/n8watkins/open-ping',
    liveSite: 'https://openping.n8builds.dev',
    buildSlug: 'openping',
  },
  {
    title: 'Solara',
    subtitle: 'Personal UV & Sun-Exposure Dashboard',
    description:
      'The UV index is a number, not an answer. Solara turns live UV data, your skin type, sunscreen and activities into safe sun windows for today and the days ahead, with calendar scheduling and push reminders.',
    image: '/builds/solara/og-image.png',
    imageAlt: 'Solara: know your sun window',
    // A wide social card: anchor left so the cover crop keeps the sun.
    imagePosition: 'object-left',
    tags: ['Next.js', 'Firebase', 'Stripe'],
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://solara-uv.web.app',
    buildSlug: 'solara',
  },
  {
    title: 'Portfolio Rank',
    subtitle: 'Developer Portfolio Ranker',
    description:
      "Ranks 1,700+ developer portfolios by what's actually good - head-to-head voting + AI scoring, not alphabetical. Build lists, save the ones you love, and like the best.",
    image: '/projects/PortfolioRank-1.png',
    images: ['/projects/PortfolioRank-1.png'],
    imageAlt: 'Portfolio Rank - developer portfolio ranker screenshot',
    tags: ['Next.js', 'TypeScript', 'Vercel'],
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.vercel.app/',
    buildSlug: 'portfolio-rank',
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
