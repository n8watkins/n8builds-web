'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiExternalLink, FiActivity } from 'react-icons/fi'
import { MdRadioButtonChecked } from 'react-icons/md'
import { now } from '@/data/now'

const statusStyles: Record<NonNullable<typeof now.status>, string> = {
  prototype: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  active: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  polishing: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  shipping: 'text-green-400 border-green-400/30 bg-green-400/10',
}

const NowBuilding = () => {
  return (
    <section id="now" aria-label="Currently building" className="py-16">
      <div className="mb-8">
        <p className="mb-2 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">
          <MdRadioButtonChecked className="h-3 w-3 animate-pulse text-green-400" />
          Currently building
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
          What I&apos;m working on right now
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="grid gap-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:grid-cols-[1.2fr_1fr] md:p-8"
      >
        {/* Left: the build */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-50">{now.project}</h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider ${statusStyles[now.status]}`}
            >
              {now.status}
            </span>
          </div>
          <p className="font-mono text-sm text-slate-500">{now.tagline}</p>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-600">Right now</p>
              <p className="mt-1 text-[#9cadc5]">{now.focus}</p>
            </div>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-600">The goal</p>
              <p className="mt-1 text-[#9cadc5]">{now.goal}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {now.stack.map((s) => (
              <span
                key={s}
                className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.7rem] text-slate-400"
              >
                {s}
              </span>
            ))}
          </div>

          {(now.links?.github || now.links?.live) && (
            <div className="mt-1 flex flex-wrap gap-3">
              {now.links?.live && (
                <a
                  href={now.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
                >
                  <FiExternalLink className="h-3.5 w-3.5" />
                  Live
                </a>
              )}
              {now.links?.github && (
                <a
                  href={now.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
                >
                  <FiGithub className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right: recent activity feed */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
          <p className="mb-4 flex items-center gap-2 font-mono text-xs text-slate-500">
            <FiActivity className="h-3.5 w-3.5 text-cyan-400" />
            recent activity
          </p>
          <ol className="relative space-y-4 border-l border-white/[0.08] pl-5">
            {now.updates.map((u, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.42rem] top-1.5 h-2 w-2 rounded-full bg-cyan-400/80 ring-4 ring-[#050812]" />
                <p className="font-mono text-[0.68rem] uppercase tracking-wider text-slate-600">{u.date}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#9cadc5]">{u.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </motion.div>
    </section>
  )
}

export default NowBuilding
