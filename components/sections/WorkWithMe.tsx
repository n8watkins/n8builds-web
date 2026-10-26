'use client'
import React from 'react'
import Image from 'next/image'
import { m } from 'motion/react'
import { useReveal } from '@/hooks/useReveal'
import { FiArrowUpRight, FiCode, FiCheck } from 'react-icons/fi'

interface Bridge {
  eyebrow: string
  title: string
  blurb: string
  points: string[]
  cta: string
  href: string
  /** preview screenshot of the destination site */
  image: string
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
      "Looking for someone to build, ship, and own real features? My portfolio is the resume - case studies, the stack, and the proof I can do the job.",
    points: ['Full-stack + AI-assisted', 'Case studies & real work', 'Available for roles'],
    cta: 'See the portfolio',
    href: 'https://portfolio.n8builds.dev',
    image: '/bridge/portfolio-2026-10.webp',
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
    eyebrow: 'Appturnity',
    title: 'Run a local service business?',
    blurb:
      'Appturnity is my company. We build pool, HVAC, landscaping and other service businesses a modern website for free, then run the systems that bring in work, like Google review requests, on one account.',
    points: ['A website built and launched for you, free', '90 days of free support', 'Review requests on the Care and Pro plans'],
    cta: 'Claim your free website',
    href: 'https://appturnity.com/#free-website',
    image: '/bridge/appturnity-2026-10.webp',
    icon: <Image src="/brands/appturnity.png" alt="" width={20} height={23} className="h-5 w-auto" />,
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
  <m.a
    href={bridge.href}
    target="_blank"
    rel="noopener noreferrer"
    // The site's scroll reveal, staggered; under reduced motion it simply shows.
    {...useReveal(index * 0.08)}
    className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-white/2 transition-all duration-200 hover:bg-white/4 ${bridge.accent.border}`}
  >
    {/* Preview screenshot of the destination site */}
    <div className="relative aspect-video overflow-hidden border-b border-white/6 bg-[#0a1322]">
      <Image
        src={bridge.image}
        alt={`${bridge.title} - site preview`}
        fill
        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#070b16] via-transparent to-transparent" />
    </div>

    {/* Content */}
    <div className="relative flex flex-1 flex-col p-7 sm:p-8">
      {/* Corner glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-linear-to-br ${bridge.accent.glow} to-transparent blur-2xl`}
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-200">
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
          className={`mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-linear-to-r ${bridge.accent.button} px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 group-hover:scale-[1.02]`}
        >
          {bridge.cta}
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  </m.a>
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
          This is where I build in public. If you like what you see, here&apos;s where it goes next:
          hire me, or let Appturnity put your business online.
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
