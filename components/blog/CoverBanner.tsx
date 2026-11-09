import Image from 'next/image'
import { coverAccent, coverUrl as generatedCoverUrl } from '@/lib/blog-cover'

// Cover for blog cards and post headers: the uploaded image if there is one,
// otherwise the generated "signal" cover (lib/blog-cover.ts), which is unique
// per post and coloured by the post's first topic. Both get the same HUD
// overlay: the topic chip, and for generated covers the post's file path.

function TopicChip({ topic, accent }: { topic: string; accent: string }) {
  return (
    <span className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-darkBlue/70 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
      {topic}
    </span>
  )
}

export default function CoverBanner({
  coverUrl,
  coverAlt,
  seed,
  topic,
  priority = false,
  className = 'aspect-video',
  bare = false,
  sizes = '(max-width: 768px) 100vw, 800px',
}: {
  coverUrl?: string
  coverAlt?: string
  seed: string
  topic?: string
  priority?: boolean
  className?: string
  /** A small thumbnail (the homepage's compact rows): the picture only, no topic chip or path. */
  bare?: boolean
  sizes?: string
}) {
  const accent = coverAccent(topic, seed)

  if (coverUrl) {
    return (
      <div className={`relative overflow-hidden ${bare ? '' : 'w-full'} ${className}`}>
        <Image
          src={coverUrl}
          alt={coverAlt || ''}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!bare && <div className="absolute inset-0 bg-linear-to-t from-darkBlue/80 via-darkBlue/10 to-transparent" />}
        {topic && !bare && <TopicChip topic={topic} accent={accent} />}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-darkBlue ${bare ? '' : 'w-full'} ${className}`} aria-hidden>
      {/* Slightly oversized so the hover drift never reveals an edge. The SVG is
          already final art, so it skips the image optimizer. */}
      <Image
        src={generatedCoverUrl(topic, seed)}
        alt=""
        fill
        unoptimized
        priority={priority}
        className="scale-[1.04] object-cover transition-transform duration-700 ease-out group-hover:-translate-x-3"
      />
      {!bare && (
        <>
          {/* Fade only the strip behind the topic chip into the card. */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-darkBlue to-transparent" />
          <span className="absolute left-4 top-3 max-w-[85%] truncate font-mono text-[0.62rem] tracking-wider text-slate-300/70">
            ~/notions/{seed}.md
          </span>
          {topic && <TopicChip topic={topic} accent={accent} />}
        </>
      )}
    </div>
  )
}
