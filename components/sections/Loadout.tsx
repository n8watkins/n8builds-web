'use client'
import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiTerminal } from 'react-icons/fi'
import { loadout, whoami, type LoadoutGroup, type LoadoutItem } from '@/data/loadout'

// Static class maps so Tailwind keeps these in the build.
const accentMap: Record<LoadoutGroup['accent'], { text: string; dot: string; ring: string; glow: string }> = {
  cyan:   { text: 'text-cyan-400',   dot: 'bg-cyan-400',   ring: 'hover:border-cyan-400/40',   glow: 'group-hover:shadow-cyan-500/10' },
  blue:   { text: 'text-blue-400',   dot: 'bg-blue-400',   ring: 'hover:border-blue-400/40',   glow: 'group-hover:shadow-blue-500/10' },
  sky:    { text: 'text-sky-400',    dot: 'bg-sky-400',    ring: 'hover:border-sky-400/40',    glow: 'group-hover:shadow-sky-500/10' },
  teal:   { text: 'text-teal-400',   dot: 'bg-teal-400',   ring: 'hover:border-teal-400/40',   glow: 'group-hover:shadow-teal-500/10' },
  indigo: { text: 'text-indigo-400', dot: 'bg-indigo-400', ring: 'hover:border-indigo-400/40', glow: 'group-hover:shadow-indigo-500/10' },
}

const ItemCard = ({ item, accent }: { item: LoadoutItem; accent: LoadoutGroup['accent'] }) => {
  const a = accentMap[accent]
  return (
    <div
      className={`group relative flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-200 ${a.ring} hover:bg-white/[0.04] hover:shadow-lg ${a.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-slate-100 leading-tight">{item.name}</h3>
        {item.tag && (
          <span className={`flex-shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider ${a.text}`}>
            {item.tag}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-[#9cadc5]">{item.whatFor}</p>
      <div className="mt-1 flex items-start gap-2 border-t border-white/[0.06] pt-3">
        <span className={`mt-0.5 flex-shrink-0 font-mono text-xs ${a.text}`}>{'//'}</span>
        <p className="font-mono text-[0.78rem] leading-relaxed text-slate-500">{item.take}</p>
      </div>
    </div>
  )
}

const Group = ({ group, index }: { group: LoadoutGroup; index: number }) => {
  const a = accentMap[group.accent]
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.2), ease: [0.25, 0.1, 0.25, 1] }}
      className="scroll-mt-24"
      id={group.id}
    >
      <div className="mb-5 flex flex-col gap-1.5">
        <span className="font-mono text-xs text-slate-600">{group.path}</span>
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${a.dot}`} />
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">{group.title}</h2>
        </div>
        <p className="text-sm text-[#9cadc5]">{group.subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map(item => (
          <ItemCard key={item.name} item={item} accent={group.accent} />
        ))}
      </div>
    </motion.section>
  )
}

const Loadout = () => {
  return (
    <main className="relative min-h-screen bg-[#050812] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to the bench
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8"
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">The Loadout</span>
          <h1 className="mt-3 text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
            My{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text text-transparent">
              loadout.
            </span>
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-[#9cadc5]">
            The tools, stack, and rig I actually run — and what I use each one for. No logo
            wall. If it earns a spot in the kit, it earns a sentence.
          </p>
        </motion.div>

        {/* whoami terminal block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-slate-500">
              <FiTerminal className="h-3.5 w-3.5" />
              nate@n8builds: ~
            </span>
          </div>
          <div className="space-y-1 p-5 font-mono text-[0.82rem] leading-relaxed">
            {whoami.map((line, i) => (
              <p key={i} className={i === 0 ? 'text-cyan-400' : 'text-slate-300'}>
                {line}
              </p>
            ))}
            <p className="text-slate-600">
              <span className="text-cyan-400">$</span> <span className="animate-pulse">▊</span>
            </p>
          </div>
        </motion.div>

        {/* Groups */}
        <div className="mt-14 space-y-16">
          {loadout.map((group, i) => (
            <Group key={group.id} group={group} index={i} />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-16 border-t border-white/[0.06] pt-8 text-center font-mono text-xs text-slate-600">
          {'// the kit changes constantly — check back, it\'s always being re-rolled.'}
        </p>
      </div>
    </main>
  )
}

export default Loadout
