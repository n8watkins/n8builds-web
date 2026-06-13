'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiGithub, FiExternalLink, FiArrowUpRight } from 'react-icons/fi'
import type { Build } from '@/data/builds'
import type { ShelfMeta } from '@/data/shelves'

const BuildCard = ({ build, index }: { build: Build; index: number }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.18), ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.04]"
    >
      {/* Accent wash */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${build.color} opacity-40 blur-2xl`} />

      {/* Stretched link → detail page (sits under the content, above the card bg) */}
      <Link
        href={`/builds/${build.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Read about ${build.name}`}
      />

      <div className="relative z-0 flex items-start justify-between gap-3">
        <span className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-500">{build.category}</span>
        {build.status === 'in the lab' ? (
          <span className="flex-shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-amber-400">
            in the lab
          </span>
        ) : (
          <span className="flex-shrink-0 rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-green-400">
            shipped
          </span>
        )}
      </div>

      <div className="relative z-0">
        <h3 className="text-lg font-bold leading-tight text-slate-50">{build.name}</h3>
        <p className="mt-1 text-sm text-[#9cadc5]">{build.tagline}</p>
      </div>

      <div className="relative z-0 mt-auto flex flex-wrap gap-1.5">
        {build.tags.map((t) => (
          <span
            key={t}
            className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.68rem] text-slate-400"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Footer: external links (z-10 so they sit above the stretched link) + read cue */}
      <div className="relative z-10 mt-1 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-2">
          {build.github && (
            <a
              href={build.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${build.name} on GitHub`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-200"
            >
              <FiGithub className="h-4 w-4" />
            </a>
          )}
          {build.liveSite && (
            <a
              href={build.liveSite}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${build.name} live site`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-200"
            >
              <FiExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <span className="flex items-center gap-1 font-mono text-[0.7rem] text-slate-600 transition-colors group-hover:text-cyan-400">
          read
          <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </motion.div>
  )
}

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
