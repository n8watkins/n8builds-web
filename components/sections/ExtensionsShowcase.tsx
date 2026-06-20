'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FiGithub, FiStar, FiArrowUpRight } from 'react-icons/fi'
import { getBuild } from '@/data/builds'

interface Ext {
  slug: string
  icon: string
  shot: string | null
  oss: boolean
  blurb: string
}

// The 3 extensions to push (open source — ask for stars). Details derive from builds.tsx.
const exts: Ext[] = [
  {
    slug: 'piper-tts',
    icon: '/builds/piper-tts/icon.png',
    shot: '/builds/piper-tts/popup.png',
    oss: true,
    blurb: 'Highlight text, right-click, hear it read aloud by a Piper model running fully on your machine. No cloud, no keys.',
  },
  {
    slug: 'tubevault',
    icon: '/builds/tubevault/icon.png',
    shot: '/builds/tubevault/tubevault-popup.png',
    oss: true,
    blurb: 'Archive YouTube videos, playlists, and channels locally with a yt-dlp helper. Your library, on your disk.',
  },
  {
    slug: 'tldw',
    icon: '/builds/tldw/icon.png',
    shot: null,
    oss: true,
    blurb: 'On any YouTube video, hit Alt+G — it opens Gemini with a saved prompt and the video, and submits. Too Long; Didn\'t Watch.',
  },
]

const CYCLE_MS = 5000

const Detail = ({ ext }: { ext: Ext }) => {
  const build = getBuild(ext.slug)
  if (!build) return null
  return (
    <div className="grid gap-6 md:grid-cols-2 md:items-center">
      {/* Visual */}
      <a
        href={build.github}
        target="_blank"
        rel="noopener noreferrer"
        className="group/visual relative block aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101d]"
      >
        {ext.shot ? (
          <Image
            src={ext.shot}
            alt={`${build.name} screenshot`}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover/visual:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a1a33] to-[#081427]">
            <Image src={ext.icon} alt={`${build.name} icon`} width={88} height={88} className="rounded-2xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050812]/50 to-transparent" />
      </a>

      {/* Text */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Image src={ext.icon} alt="" width={36} height={36} className="rounded-xl" />
          <div>
            <h3 className="text-xl font-extrabold leading-tight text-slate-50">{build.name}</h3>
            <p className="font-mono text-xs text-slate-500">{build.tagline}</p>
          </div>
        </div>
        <p className="text-[#9cadc5] leading-relaxed">{ext.blurb}</p>
        <div className="flex flex-wrap gap-1.5">
          {build.tags.map((t) => (
            <span key={t} className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.68rem] text-slate-400">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {build.github && (
            <a
              href={build.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/90 to-yellow-500/90 px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:scale-[1.02]"
            >
              <FiStar className="h-4 w-4" />
              Star on GitHub
            </a>
          )}
          <Link
            href={`/builds/${build.slug}`}
            className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
          >
            Read more
            <FiArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

const ExtensionsShowcase = () => {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // auto-cycle (desktop). Pauses on hover.
  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => {
      setActive((a) => (a + 1) % exts.length)
      setProgressKey((k) => k + 1)
    }, CYCLE_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [paused])

  const select = (i: number) => {
    setActive(i)
    setProgressKey((k) => k + 1)
  }

  return (
    <section id="extensions" aria-label="Chrome extensions" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-indigo-400">Browser tools</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Chrome extensions</h2>
          <p className="mt-2 max-w-[520px] text-[#9cadc5]">
            Small, local-first tools I built and actually use. All open source — if one&apos;s useful, a star helps a ton.
          </p>
        </div>
        <Link
          href="/extensions"
          className="group hidden items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08] sm:flex"
        >
          See all
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* ===== Desktop: 3 side-by-side + auto-cycle detail ===== */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-4">
          {exts.map((ext, i) => {
            const build = getBuild(ext.slug)
            const isActive = i === active
            return (
              <button
                key={ext.slug}
                onMouseEnter={() => {
                  setPaused(true)
                  select(i)
                }}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => {
                  setPaused(true)
                  select(i)
                }}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                  isActive
                    ? 'border-cyan-400/40 bg-white/[0.05] shadow-lg shadow-cyan-500/5'
                    : 'border-white/[0.08] bg-white/[0.02] opacity-55 blur-[1.5px] hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Image src={ext.icon} alt="" width={40} height={40} className="rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-100">{build?.name}</p>
                    <p className="truncate font-mono text-[0.7rem] text-slate-500">{build?.tagline}</p>
                  </div>
                </div>
                {/* progress timer on the active card */}
                <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  {isActive && (
                    <motion.div
                      key={progressKey}
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      initial={{ width: '0%' }}
                      animate={{ width: paused ? '100%' : '100%' }}
                      transition={{ duration: paused ? 0.3 : CYCLE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel — carousels as active changes */}
        <div className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Detail ext={exts[active]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ===== Mobile: stacked, each with its detail (no hover/cycle) ===== */}
      <div className="flex flex-col gap-5 md:hidden">
        {exts.map((ext) => (
          <div key={ext.slug} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <Detail ext={ext} />
          </div>
        ))}
      </div>

      {/* Launch Kit banner */}
      <Link
        href="/builds/chrome-extension-kit"
        className="group mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 font-mono text-cyan-400">{'</>'}</span>
          <div>
            <p className="font-bold text-slate-100">Chrome Extension Launch Kit</p>
            <p className="text-sm text-slate-500">The MV3 starter all three of these are built on — clone it and ship your own.</p>
          </div>
        </div>
        <span className="flex items-center gap-1 font-mono text-sm text-slate-500 transition-colors group-hover:text-cyan-400">
          view <FiArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  )
}

export default ExtensionsShowcase
