'use client'
import React, { ReactElement } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Marquee from '@/components/magicui/marquee'
import { FiArrowUpRight } from 'react-icons/fi'
import { tech_libraries, tech_tools } from '@/data/techStack'

// The portfolio's bento tech-stack item, re-themed for n8builds (dark, cyan).
// Icon + name show; the description reveals on hover.
const StackContainer = ({
  name,
  icon,
  description,
}: {
  name: string
  icon?: string | ReactElement
  description: string
}) => (
  <figure
    className={cn(
      'relative flex h-28 min-w-40 max-w-52 cursor-pointer items-center justify-center overflow-hidden rounded-xl border px-2 pb-2',
      'border-white/[0.08] bg-white/[0.04] hover:border-cyan-400/30 hover:bg-white/[0.08]',
      'transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-cyan-500/5',
      '[&_.content-wrapper]:hover:scale-75 [&_.content-wrapper]:hover:-translate-y-9',
      '[&_.description]:hover:opacity-100'
    )}
  >
    <div className="content-wrapper flex flex-col items-center transition-all duration-300 ease-in-out">
      <figcaption className="mt-2 flex flex-col items-center text-xl font-medium text-white transition-all duration-300 ease-in-out">
        <div className="flex flex-row items-center gap-2 pt-24 text-cyan-300/90">
          <span className="transition-transform duration-300 ease-in-out">{icon}</span>
          <span className="whitespace-nowrap text-white transition-all duration-300 ease-in-out">{name}</span>
        </div>
        <div className="description flex h-24 w-48 items-start justify-center text-center text-sm text-[#9cadc5] opacity-0 transition-all duration-300 ease-in-out">
          {description}
        </div>
      </figcaption>
    </div>
  </figure>
)

const TechStackBento = ({ showLink = true }: { showLink?: boolean }) => {
  return (
    <section id="techstack" aria-label="My tech stack" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">The loadout</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">My tech stack</h2>
          <p className="mt-2 max-w-[480px] text-[#9cadc5]">
            What I build with. Hover any tile for what it&apos;s for — or see the full loadout, rig, and AI kit.
          </p>
        </div>
        {showLink && (
          <Link
            href="/loadout"
            className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
          >
            See the full loadout
            <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </div>

      <div className="relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#081427] via-[#0a1a33] to-[#081427] py-8">
        <Marquee pauseOnHover className="[--duration:50s]">
          {tech_libraries.map((t) => (
            <StackContainer key={t.name} name={t.name} icon={t.icon} description={t.description} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:50s]">
          {tech_tools.map((t) => (
            <StackContainer key={t.name} name={t.name} icon={t.icon} description={t.description} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute left-0 h-full w-1/4 bg-gradient-to-r from-[#081427] to-transparent" />
        <div className="pointer-events-none absolute right-0 h-full w-1/4 bg-gradient-to-l from-[#081427] to-transparent" />
      </div>
    </section>
  )
}

export default TechStackBento
