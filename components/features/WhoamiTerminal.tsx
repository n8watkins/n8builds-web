import { whoami, whoamiTitle } from '@/data/loadout'
import FadeIn from '@/components/ui/FadeIn'

/** Seconds per typed character, and the pause between lines. */
const CHAR = 0.032
const PAUSE = 0.3
/** Typing starts once the terminal has mostly faded in. */
const FIRST = 0.55

/**
 * When each line starts typing and how long its cursor stays on it (it waits
 * there through the pause), and when the prompt comes back.
 */
const typing = (() => {
  const starts: number[] = []
  const holds: number[] = []
  let t = FIRST
  whoami.forEach((line, i) => {
    starts.push(+t.toFixed(3))
    t += line.length * CHAR + PAUSE
    // The last line's cursor goes as the prompt's appears, so there is one cursor.
    holds.push(+(line.length * CHAR + (i < whoami.length - 1 ? PAUSE : 0)).toFixed(3))
  })
  return { starts, holds, end: +(t - PAUSE).toFixed(3) }
})()

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
      {/* The body types itself out on load, one line after the other, then
          the prompt comes back with a blinking cursor. All CSS (whoami-type
          in app/globals.css): the text is in the server HTML at full size, so
          it reads without JavaScript, search engines get it, and its space is
          reserved (no layout shift); only a clip-path steps across it, one
          character per step. Reduced motion shows it all at once. */}
      {/* Each line stays on one line (a typed line can't wrap): on a phone the
          font scales with the screen so the longest line (38ch, ~23em) fits
          inside the gutter, border and padding, up to the usual 0.82rem. */}
      <div className="space-y-1 whitespace-nowrap p-4 font-mono text-[min(0.82rem,calc((100vw-4.5rem-2px)/23.4))] leading-relaxed min-[400px]:p-5">
        {whoami.map((line, i) => (
          <p key={i} className="text-slate-300">
            <span
              className="whoami-type"
              style={{
                ['--chars' as string]: line.length,
                ['--start' as string]: `${typing.starts[i]}s`,
                ['--hold' as string]: `${typing.holds[i]}s`,
              }}
            >
              <span>{line}</span>
            </span>
          </p>
        ))}
        <p className="whoami-prompt text-slate-475" style={{ ['--start' as string]: `${typing.end}s` }}>
          <span className="text-cyan-400">$</span> <span className="whoami-cursor">▊</span>
        </p>
      </div>
    </FadeIn>
  )
}
