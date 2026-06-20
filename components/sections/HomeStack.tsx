'use client'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import AITechStack from '@/components/features/AITechStack'
import { buildStacks } from '@/data/buildStacks'

// Homepage "stack" section: lead with the AI kit (the differentiator) + a short
// TL;DR of the default build stack. The full generic tech marquee lives on /loadout.
export default function HomeStack() {
  const turso = buildStacks.find((s) => s.name === 'The Turso Stack') ?? buildStacks[0]

  return (
    <section id="loadout" aria-label="My stack" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">The loadout</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">The AI kit I build with</h2>
          <p className="mt-2 max-w-[520px] text-[#9cadc5]">
            The agents and tools doing the heavy lifting right now — hover a tile for what I use it for.
          </p>
        </div>
        <Link
          href="/loadout"
          className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
        >
          See the full loadout
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <AITechStack />

      {/* TL;DR — my default stack */}
      <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">TL;DR — my default stack</span>
          <span className="text-slate-600">·</span>
          <span className="font-semibold text-slate-100">{turso.name}</span>
          <span className="text-sm text-slate-500">{turso.tagline}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {turso.tools.map((t) => (
            <span key={t} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-slate-300">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#9cadc5]">{turso.note}</p>
      </div>
    </section>
  )
}
