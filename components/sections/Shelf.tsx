'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import type { Build } from '@/data/builds'
import type { ShelfMeta } from '@/data/shelves'
import BuildCard from '@/components/sections/BuildCard'

const Shelf = ({ meta, builds, tags }: { meta: ShelfMeta; builds: Build[]; tags: string[] }) => {
  const [active, setActive] = useState<string | null>(null)

  const visible = useMemo(
    () => (active ? builds.filter((b) => b.tags.includes(active)) : builds),
    [active, builds]
  )

  return (
    <main className="relative min-h-screen bg-[#050812] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to the bench
        </Link>

        {/* Header */}
        <div className="mt-8">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">{meta.eyebrow}</span>
          <h1 className="mt-3 text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
            {meta.heading}
          </h1>
          <p className="mt-4 max-w-[600px] text-base leading-relaxed text-[#9cadc5]">{meta.blurb}</p>
        </div>

        {/* Filter row */}
        {tags.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActive(null)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
                active === null
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
            >
              All
              <span className="ml-1.5 text-xs opacity-60">{builds.length}</span>
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActive((cur) => (cur === tag ? null : tag))}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
                  active === tag
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 ? (
          <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((b, i) => (
              <BuildCard key={b.slug} build={b} index={i} />
            ))}
          </motion.div>
        ) : (
          <p className="mt-16 text-center font-mono text-sm text-slate-600">
            {'// nothing here yet — more is always cooking on stream.'}
          </p>
        )}
      </div>
    </main>
  )
}

export default Shelf
