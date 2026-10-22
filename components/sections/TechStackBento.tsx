'use client'
import React from 'react'
import Link from 'next/link'
import Marquee from '@/components/magicui/marquee'
import StackTile from '@/components/ui/StackTile'
import { FiArrowUpRight } from 'react-icons/fi'
import { tech_libraries, tech_tools } from '@/data/techStack'

const TechStackBento = ({ showLink = true }: { showLink?: boolean }) => {
  return (
    <section id="techstack" aria-label="My tech stack" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">The loadout</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">My tech stack</h2>
          <p className="mt-2 max-w-[480px] text-[#9cadc5]">
            What I build with. Hover or tap any tile for what it&apos;s for — or see the full loadout, rig, and AI kit.
          </p>
        </div>
        {showLink && (
          <Link
            href="/loadout"
            className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
          >
            See the full loadout
            <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </div>

      <div className="relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-white/6 bg-linear-to-br from-[#081427] via-[#0a1a33] to-[#081427] py-8">
        <Marquee label="Libraries and frameworks" pauseOnHover className="[--duration:50s]">
          {tech_libraries.map((t) => (
            <StackTile key={t.name} name={t.name} icon={t.icon} description={t.description} iconClassName="text-cyan-300/90" />
          ))}
        </Marquee>
        <Marquee label="Tools and services" reverse pauseOnHover className="[--duration:50s]">
          {tech_tools.map((t) => (
            <StackTile key={t.name} name={t.name} icon={t.icon} description={t.description} iconClassName="text-cyan-300/90" />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute left-0 h-full w-1/4 bg-linear-to-r from-[#081427] to-transparent motion-reduce:hidden" />
        <div className="pointer-events-none absolute right-0 h-full w-1/4 bg-linear-to-l from-[#081427] to-transparent motion-reduce:hidden" />
      </div>
    </section>
  )
}

export default TechStackBento
