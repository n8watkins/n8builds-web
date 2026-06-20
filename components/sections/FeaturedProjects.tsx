'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiGithub, FiExternalLink } from 'react-icons/fi'
import { defaultAnimationConfig } from '@/lib/animations'
import TechStackCycle from '@/components/Projects/TechStackCycle'
import { projects } from '@/data/projects'

interface FeaturedProject {
  title: string
  subtitle: string
  description: string
  image: string
  images?: string[]
  tags: string[]
  github?: string
  liveSite?: string
  imageAlt: string
}

const featured: FeaturedProject[] = [
  {
    title: 'Portfolio Rank',
    subtitle: 'Developer Portfolio Ranker',
    description:
      "Ranks 1,700+ developer portfolios by what's actually good — head-to-head voting plus AI scoring, not alphabetical. Browse the catalog, search, and see how the best stack up.",
    image: '/projects/PortfolioRank-1.png',
    images: ['/projects/PortfolioRank-1.png'],
    imageAlt: 'Portfolio Rank — developer portfolio ranker screenshot',
    tags: ['Next.js', 'TypeScript', 'Vercel'],
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.vercel.app/',
  },
  {
    title: 'Quizmatic',
    subtitle: 'AI Quiz Generation',
    description:
      'AI-powered quiz generator built on OpenAI. Users get personalized quizzes on any topic with adaptive difficulty. Postgres-backed, Vercel-deployed.',
    image: '/projects/quizmatic.webp',
    images: [
      '/projects/quizmatic.webp',
      '/projects/quizmatic1.webp',
      '/projects/quizmatic2.webp',
      '/projects/quizmatic3.webp',
    ],
    imageAlt: 'Quizmatic AI quiz generator screenshot',
    tags: ['Next.js', 'OpenAI', 'Prisma', 'Postgres'],
    github: 'https://github.com/n8watkins/Quizmatic',
    liveSite: 'https://quizmatic.vercel.app/',
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
    <div className="w-full md:w-1/2 flex-shrink-0">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#07101d] aspect-[16/10] group">
        <Image
          key={current}
          src={current}
          alt={project.imageAlt}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050812]/40 to-transparent pointer-events-none" />
      </div>

      {/* Thumbnail strip */}
      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2">
          {gallery.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`${project.title} image ${i + 1}`}
              className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border transition-all duration-200 ${
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
        <p className="text-[#9cadc5] text-sm sm:text-base leading-relaxed">{project.description}</p>
      </div>

      {/* Tech stack — interactive icon dock, falls back to flat tags */}
      {technologies ? (
        <TechStackCycle technologies={technologies} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {project.tags.map(tag => (
            <span key={tag}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex items-center gap-3 pt-1">
        {project.liveSite && (
          <a href={project.liveSite} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02]">
            <FiExternalLink className="w-3.5 h-3.5" />
            Live Site
          </a>
        )}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-sm transition-all duration-200 hover:scale-[1.02]">
            <FiGithub className="w-3.5 h-3.5" />
            GitHub
          </a>
        )}
      </div>
    </div>
  </motion.div>
  )
}

const FeaturedProjects = () => (
  <section id="builds" aria-label="Featured builds" className="py-16">
    <div className="mb-10">
      <p className="text-[0.7rem] font-bold tracking-[0.16em] uppercase text-blue-400 mb-2">Featured</p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50">
        Recent builds
      </h2>
    </div>

    <div className="flex flex-col gap-16 md:gap-20">
      {featured.map((p, i) => (
        <ProjectRow key={p.title} project={p} flipped={i % 2 === 1} />
      ))}
    </div>
  </section>
)

export default FeaturedProjects
