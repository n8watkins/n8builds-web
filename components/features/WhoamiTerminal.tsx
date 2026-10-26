import { whoami, whoamiTitle } from '@/data/loadout'
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
      data-terminal=""
    >
      {/* Title bar: the window dots, then the session's title with the name.
          One line; it truncates rather than wraps on a very narrow screen. */}
      <div className="flex items-center gap-2 border-b border-white/6 px-3 py-2.5 min-[360px]:px-4">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-400/70" />
        <p
          data-terminal-title=""
          className="ml-1 min-w-0 truncate font-mono text-[0.66rem] text-slate-400 min-[360px]:ml-2 min-[360px]:text-[0.72rem] min-[400px]:tracking-wide"
        >
          {/* Below 360px the "~/" goes, so the whole name still fits. */}
          <span className="text-cyan-400/80">
            <span className="max-[359px]:hidden">{whoamiTitle.path.slice(0, 2)}</span>
            {whoamiTitle.path.slice(2)}
          </span>
          <span className="text-slate-475"> :: </span>
          <span className="text-slate-200">{whoamiTitle.name}</span>
        </p>
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
