'use client'
import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
import { loadout } from '@/data/loadout'

// Pull the highlighted items (tagged ones) for the teaser — the "headliners".
const highlights = loadout
  .flatMap((g) => g.items.map((item) => ({ ...item, group: g.title })))
  .filter((item) => item.tag)
  .slice(0, 6)

const LoadoutTeaser = () => {
  return (
    <section id="loadout" aria-label="Tech loadout" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">The loadout</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
            The tools I actually run
          </h2>
          <p className="mt-2 max-w-[460px] text-[#9cadc5]">
            Not a logo wall — what I use and what I use it for. Here are the headliners.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.16), ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold leading-tight text-slate-100">{item.name}</h3>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-cyan-400">
                {item.tag}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#9cadc5]">{item.whatFor}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default LoadoutTeaser
