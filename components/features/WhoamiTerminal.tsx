'use client'
import { motion } from 'framer-motion'
import { FiTerminal } from 'react-icons/fi'
import { whoami } from '@/data/loadout'

/**
 * The macOS-style `whoami` terminal block. Extracted from the Loadout page so
 * the homepage hero and /loadout share one implementation.
 */
export default function WhoamiTerminal({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 backdrop-blur-sm ${className}`}
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
  )
}
