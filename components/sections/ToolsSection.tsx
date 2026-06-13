'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiStar, FiArrowUpRight, FiExternalLink, FiMonitor, FiGlobe } from 'react-icons/fi'
import { getBuild } from '@/data/builds'

interface FreeTool {
  slug: string
  icon: string
  visual: string | null
  platform: { label: string; icon: React.ReactNode }
  blurb: string
}

// Free tools I made and want people to actually use.
const tools: FreeTool[] = [
  {
    slug: 'localdictate',
    icon: '/builds/localdictate/icon.png',
    visual: null,
    platform: { label: 'Windows · free', icon: <FiMonitor className="h-3.5 w-3.5" /> },
    blurb: 'Hold a hotkey, talk, release — your words get transcribed locally by whisper.cpp and dropped wherever your cursor is. No cloud, no account, no audio leaves your PC.',
  },
  {
    slug: 'sprite-arsenal',
    icon: '/builds/sprite-arsenal/icon.png',
    visual: '/builds/sprite-arsenal/og-image.png',
    platform: { label: 'In-browser · free', icon: <FiGlobe className="h-3.5 w-3.5" /> },
    blurb: 'Drop in a sprite sheet, slice it, preview the animation, and export a GIF or frames — entirely in your browser. No sign-up, nothing uploaded.',
  },
  {
    slug: 'canihost',
    icon: '/builds/canihost/icon.png',
    visual: '/builds/canihost/og-image.png',
    platform: { label: 'In-browser · free', icon: <FiGlobe className="h-3.5 w-3.5" /> },
    blurb: 'Browse 1,300+ self-hosted apps by what you want to do ("replace Google Photos"), find out if your box can run them with a RAM/CPU calculator, and generate the docker-compose. Built on awesome-selfhosted.',
  },
  {
    slug: 'freestack',
    icon: '/builds/freestack/icon.png',
    visual: '/builds/freestack/og-image.png',
    platform: { label: 'In-browser · free', icon: <FiGlobe className="h-3.5 w-3.5" /> },
    blurb: 'Every free developer tier from the free-for-dev list, browsable by what you need to build — then compare 2–4 free tiers head-to-head with the best value in each row highlighted.',
  },
  {
    slug: 'apiscout',
    icon: '/builds/apiscout/icon.png',
    visual: '/builds/apiscout/og-image.png',
    platform: { label: 'In-browser · free', icon: <FiGlobe className="h-3.5 w-3.5" /> },
    blurb: 'Find, filter and test 1,500+ free public APIs live in your browser. Real categories (Animals, Anime, Weather…), a no-auth + CORS filter, and HTTPS marked verified — not just claimed.',
  },
]

const ToolCard = ({ tool, index }: { tool: FreeTool; index: number }) => {
  const build = getBuild(tool.slug)
  if (!build) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.2), ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.04]"
    >
      {/* Visual */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-[#0a1a33] to-[#081427]">
        {tool.visual ? (
          <Image
            src={tool.visual}
            alt={`${build.name} preview`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image src={tool.icon} alt={`${build.name} icon`} width={84} height={84} className="rounded-2xl" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-green-400/30 bg-green-400/15 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-green-300">
          Free
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-3">
          <Image src={tool.icon} alt="" width={36} height={36} className="rounded-xl" />
          <div>
            <h3 className="text-lg font-extrabold leading-tight text-slate-50">{build.name}</h3>
            <p className="font-mono text-xs text-slate-500">{build.tagline}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#9cadc5]">{tool.blurb}</p>

        <div className="flex items-center gap-1.5 font-mono text-[0.7rem] text-slate-500">
          {tool.platform.icon}
          {tool.platform.label}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          {build.liveSite && (
            <a
              href={build.liveSite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
            >
              <FiExternalLink className="h-3.5 w-3.5" />
              Try it
            </a>
          )}
          {build.github && (
            <a
              href={build.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/90 to-yellow-500/90 px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:scale-[1.02]"
            >
              <FiStar className="h-4 w-4" />
              Star
            </a>
          )}
          <Link
            href={`/builds/${build.slug}`}
            className="flex items-center gap-1 font-mono text-sm text-slate-500 transition-colors hover:text-cyan-400"
          >
            read <FiArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

const ToolsSection = () => {
  return (
    <section id="tools" aria-label="Free tools I made" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Dev tools</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Free tools I made</h2>
          <p className="mt-2 max-w-[520px] text-[#9cadc5]">
            I built these for myself, then made them free. Go use them — and a star never hurts.
          </p>
        </div>
        <Link
          href="/tools"
          className="group hidden items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08] sm:flex"
        >
          See all
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {tools.map((t, i) => (
          <ToolCard key={t.slug} tool={t} index={i} />
        ))}
      </div>
    </section>
  )
}

export default ToolsSection
