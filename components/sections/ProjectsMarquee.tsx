'use client'
import React from 'react'
import Link from 'next/link'
import Marquee from '@/components/magicui/marquee'
import { FiGithub, FiArrowUpRight } from 'react-icons/fi'
import { builds, type Build } from '@/data/builds'

const ProjectCard = ({ slug, name, tagline, tags, color }: Build) => (
  <Link
    href={`/builds/${slug}`}
    className={`group relative flex flex-col gap-2 w-[220px] mx-3 p-4 rounded-2xl border border-white/8 bg-gradient-to-br ${color} backdrop-blur-sm hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-0.5`}
  >
    <div className="flex items-start justify-between gap-2">
      <h4 className="font-bold text-sm text-slate-100 leading-tight">{name}</h4>
      <FiArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 transition-colors flex-shrink-0 mt-0.5" />
    </div>
    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{tagline}</p>
    <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
      {tags.map(tag => (
        <span key={tag} className="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-400">
          {tag}
        </span>
      ))}
    </div>
  </Link>
)

const ProjectsMarquee = () => {
  const half = Math.ceil(builds.length / 2)
  const row1 = builds.slice(0, half)
  const row2 = builds.slice(half)

  return (
    <section id="lab" className="py-14 overflow-hidden" aria-label="Projects showcase">
      <div className="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
              Builds from the{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">lab</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm md:text-base">
              Apps, agents, extensions, and local-AI experiments — built in the open. Click any card for the full story.
            </p>
          </div>
          <a
            href="https://github.com/n8watkins"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] flex-shrink-0"
          >
            <FiGithub className="w-4 h-4" />
            View all
          </a>
        </div>
      </div>

      <div className="relative">
        {/* Left/right fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#000319] to-transparent z-10 pointer-events-none dark:from-[#000319]" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#000319] to-transparent z-10 pointer-events-none dark:from-[#000319]" />

        <Marquee pauseOnHover repeat={3} className="[--duration:35s] py-2">
          {row1.map(p => <ProjectCard key={p.slug} {...p} />)}
        </Marquee>
        <Marquee pauseOnHover reverse repeat={3} className="[--duration:38s] py-2">
          {row2.map(p => <ProjectCard key={p.slug} {...p} />)}
        </Marquee>
      </div>
    </section>
  )
}

export default ProjectsMarquee
