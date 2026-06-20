import Image from 'next/image'

// Themed gradient fallbacks used when a post has no uploaded cover image, so
// every post still reads as a designed "card" that matches the HUD aesthetic.
const PALETTES = [
  'from-cyan-500/30 via-blue-600/20 to-indigo-700/30',
  'from-fuchsia-500/25 via-purple-600/20 to-blue-700/30',
  'from-emerald-500/25 via-teal-600/20 to-cyan-700/30',
  'from-amber-500/25 via-orange-600/20 to-rose-700/30',
  'from-rose-500/25 via-pink-600/20 to-purple-700/30',
  'from-sky-500/25 via-indigo-600/20 to-violet-700/30',
]

function seedIndex(seed: string, mod: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % mod
}

export default function CoverBanner({
  coverUrl,
  coverAlt,
  seed,
  topic,
  priority = false,
  className = 'aspect-[16/9]',
}: {
  coverUrl?: string
  coverAlt?: string
  seed: string
  topic?: string
  priority?: boolean
  className?: string
}) {
  if (coverUrl) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`}>
        <Image
          src={coverUrl}
          alt={coverAlt || ''}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050812]/80 via-[#050812]/10 to-transparent" />
      </div>
    )
  }

  // Generated cover — deterministic themed gradient + dot grid.
  const palette = PALETTES[seedIndex(seed, PALETTES.length)]
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br ${palette} ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.13)_1px,transparent_0)] bg-[size:18px_18px]" />
      <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050812] via-[#050812]/20 to-transparent" />
      {topic && (
        <span className="absolute bottom-3 left-4 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/75">
          {topic}
        </span>
      )}
    </div>
  )
}
