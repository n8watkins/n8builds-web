'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { buildStacks, type BuildStack } from '@/data/buildStacks'

const accentMap: Record<BuildStack['accent'], { bar: string; text: string }> = {
  cyan: { bar: 'from-cyan-400 to-blue-500', text: 'text-cyan-400' },
  blue: { bar: 'from-blue-400 to-indigo-500', text: 'text-blue-400' },
  sky: { bar: 'from-sky-400 to-cyan-500', text: 'text-sky-400' },
  teal: { bar: 'from-teal-400 to-cyan-500', text: 'text-teal-400' },
}

const StackCard = ({ stack, index }: { stack: BuildStack; index: number }) => {
  const a = accentMap[stack.accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2), ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.04]"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${a.bar}`} />

      <div>
        <h3 className="text-xl font-extrabold tracking-tight text-slate-50">{stack.name}</h3>
        <p className={`mt-0.5 text-sm font-semibold ${a.text}`}>{stack.tagline}</p>
      </div>

      {/* The combo — tools chained together */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {stack.tools.map((tool, i) => (
          <React.Fragment key={tool}>
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-mono text-[0.75rem] text-slate-200">
              {tool}
            </span>
            {i < stack.tools.length - 1 && <span className="text-white/20">+</span>}
          </React.Fragment>
        ))}
      </div>

      <p className="mt-auto flex items-start gap-2 border-t border-white/[0.06] pt-3 font-mono text-[0.78rem] leading-relaxed text-slate-500">
        <span className={a.text}>{'//'}</span>
        {stack.note}
      </p>
    </motion.div>
  )
}

export function BuildStacks() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {buildStacks.map((stack, i) => (
        <StackCard key={stack.name} stack={stack} index={i} />
      ))}
    </div>
  )
}

export default BuildStacks
