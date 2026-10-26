import { whoami } from '@/data/loadout'
import FadeIn from '@/components/ui/FadeIn'

/**
 * The macOS-style `whoami` terminal block. Extracted from the Loadout page so
 * the homepage hero and /loadout share one implementation. It is above the
 * fold in both, so it fades in with CSS, without waiting on hydration.
 */
export default function WhoamiTerminal({ className = '' }: { className?: string }) {
  return (
    <FadeIn
      delay={0.1}
      className={`overflow-hidden rounded-2xl border border-white/8 bg-black/30 backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="space-y-1 p-5 font-mono text-[0.82rem] leading-relaxed">
        {whoami.map((line, i) => (
          <p key={i} className={i === 0 ? 'text-cyan-400' : 'text-slate-300'}>
            {line}
          </p>
        ))}
        <p className="text-slate-475">
          <span className="text-cyan-400">$</span> <span className="animate-pulse">▊</span>
        </p>
      </div>
    </FadeIn>
  )
}
