'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { FiArrowUpRight, FiCode, FiLayout, FiCheck } from 'react-icons/fi'

interface Bridge {
  eyebrow: string
  title: string
  blurb: string
  points: string[]
  cta: string
  href: string
  icon: React.ReactNode
  accent: {
    eyebrow: string
    border: string
    glow: string
    check: string
    button: string
  }
}

// Two doors off the workshop. n8builds is the top-of-funnel; it should feed
// the portfolio (developer credibility) and Appturnity (client work), never
// replace them. Keep these copies conversational, not salesy.
const bridges: Bridge[] = [
  {
    eyebrow: 'Hiring',
    title: 'Need a developer?',
    blurb:
      "Looking for someone to build, ship, and own real features? My portfolio is the resume — case studies, the stack, and the proof I can do the job.",
    points: ['Full-stack + AI-assisted', 'Case studies & real work', 'Available for roles'],
    cta: 'See the portfolio',
    href: 'https://portfolio.n8builds.dev',
    icon: <FiCode className="h-5 w-5" />,
    accent: {
      eyebrow: 'text-cyan-400',
      border: 'hover:border-cyan-400/40',
      glow: 'from-cyan-500/[0.07]',
      check: 'text-cyan-400',
      button:
        'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400',
    },
  },
  {
    eyebrow: 'Project work',
    title: 'Need a website or business system?',
    blurb:
      "Have an idea, a business to put online, or an internal tool that should already exist? That's Appturnity — I take it from a conversation to something live you can use.",
    points: ['Websites & web apps', 'Custom business systems', 'From idea to shipped'],
    cta: 'Start a project',
    href: 'https://appturnity.com',
    icon: <FiLayout className="h-5 w-5" />,
    accent: {
      eyebrow: 'text-emerald-400',
      border: 'hover:border-emerald-400/40',
      glow: 'from-emerald-500/[0.07]',
      check: 'text-emerald-400',
      button:
        'from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400',
    },
  },
]

const BridgeCard = ({ bridge, index }: { bridge: Bridge; index: number }) => (
  <motion.a
    href={bridge.href}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
    className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all duration-200 hover:bg-white/[0.04] sm:p-8 ${bridge.accent.border}`}
  >
    {/* Corner glow */}
    <div
      aria-hidden
      className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${bridge.accent.glow} to-transparent blur-2xl`}
    />

    <div className="relative flex flex-1 flex-col">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200">
          {bridge.icon}
        </span>
        <p className={`text-[0.7rem] font-bold uppercase tracking-[0.16em] ${bridge.accent.eyebrow}`}>
          {bridge.eyebrow}
        </p>
      </div>

      <h3 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-slate-50">
        {bridge.title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-[#9cadc5]">{bridge.blurb}</p>

      <ul className="mt-5 flex flex-col gap-2">
        {bridge.points.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
            <FiCheck className={`h-4 w-4 shrink-0 ${bridge.accent.check}`} />
            {p}
          </li>
        ))}
      </ul>

      <div
        className={`mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r ${bridge.accent.button} px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 group-hover:scale-[1.02]`}
      >
        {bridge.cta}
        <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </div>
  </motion.a>
)

const WorkWithMe = () => {
  return (
    <section id="work-with-me" aria-label="Work with me" className="py-16">
      <div className="mb-8 max-w-[640px]">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Work with me</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
          Two ways to put me to work
        </h2>
        <p className="mt-2 text-[#9cadc5]">
          This is where I build in public. If you like what you see, here&apos;s where it goes next —
          hire me, or have me build the thing.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {bridges.map((b, i) => (
          <BridgeCard key={b.href} bridge={b} index={i} />
        ))}
      </div>
    </section>
  )
}

export default WorkWithMe
