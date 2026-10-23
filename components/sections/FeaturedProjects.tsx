'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { FiGithub, FiExternalLink, FiFileText } from 'react-icons/fi'
import { defaultAnimationConfig } from '@/lib/animations'
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

const featured: FeaturedProject[] = [
  {
    title: 'Portfolio Rank',
    subtitle: 'Developer Portfolio Ranker',
    description:
      "Ranks 1,700+ developer portfolios by what's actually good — head-to-head voting + AI scoring, not alphabetical. Build lists, save the ones you love, and like the best.",
    image: '/projects/PortfolioRank-1.png',
    images: ['/projects/PortfolioRank-1.png'],
    imageAlt: 'Portfolio Rank — developer portfolio ranker screenshot',
    tags: ['Next.js', 'TypeScript', 'Vercel'],
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.vercel.app/',
    buildSlug: 'portfolio-rank',
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
    tags: ['Next.js', 'Firebase', 'Open-Meteo'],
    github: 'https://github.com/n8watkins/solara',
    liveSite: 'https://uv-activity-planner.web.app',
    buildSlug: 'solara',
  },
]

const ProjectRow = ({ project, flipped }: { project: FeaturedProject; flipped: boolean }) => {
  const technologies = projects.find((p) => p.title === project.title)?.technologies
  const gallery = project.images && project.images.length > 1 ? project.images : [project.image]
  const [active, setActive] = useState(0)
  const current = gallery[Math.min(active, gallery.length - 1)]
  return (
  <motion.div
    {...defaultAnimationConfig}
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

      {/* Tech stack — interactive icon dock, falls back to flat tags */}
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
    <LabSubheader eyebrow="Featured" eyebrowClass="text-blue-400" title="Recent builds" />

    <div className="flex flex-col gap-16 md:gap-20">
      {featured.map((p, i) => (
        <ProjectRow key={p.title} project={p} flipped={i % 2 === 1} />
      ))}
    </div>
  </section>
)

export default FeaturedProjects
