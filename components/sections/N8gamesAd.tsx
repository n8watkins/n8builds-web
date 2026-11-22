import { getImageProps } from 'next/image'
import Link from 'next/link'
import { FiArrowRight, FiArrowUpRight, FiPlay } from 'react-icons/fi'
import { N8GAMES_AD } from '@/data/n8games'
import { media } from '@/lib/media'

/**
 * The ad for n8games (owner, 2026-11-16): the rendered party room, wide, with
 * one line, "Play" to the games site and "Learn more" to its build page. On
 * the homepage and at the top of /games; `N8GAMES_AD` in data/n8games/index.ts holds
 * its words and pictures and switches it off.
 *
 * The picture is art-directed: the whole room (2:1) from 640px, and a crop
 * close on the pieces (16:10) on phones, where the whole room would make them
 * too small to read. Its frame takes each one's aspect ratio in CSS before
 * anything loads, so nothing shifts.
 */
export default function N8gamesAd({ id = 'n8games-ad', priority = false }: { id?: string; priority?: boolean }) {
  const ad = N8GAMES_AD
  if (!ad.show) return null
  const loading = priority ? undefined : ('lazy' as const)
  // Beside the words from 1024px (about 3/5 of the card), full width above them below that.
  const sizes = '(min-width: 1024px) 680px, (min-width: 640px) 92vw, 100vw'
  const {
    props: { srcSet: wide },
  } = getImageProps({ src: media(ad.image.wide.src), width: ad.image.wide.width, height: ad.image.wide.height, alt: '', sizes })
  const {
    props: { srcSet: close, ...img },
  } = getImageProps({
    src: media(ad.image.close.src),
    width: ad.image.close.width,
    height: ad.image.close.height,
    alt: ad.image.alt,
    sizes,
    priority,
    loading,
  })
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="grid overflow-hidden rounded-2xl border border-[#f0a24b]/25 bg-linear-to-br from-[#f0a24b]/[0.07] to-[#0a1222]/80 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      {/* From 1024px the words sit beside it, so it takes their row's height (at least 2:1's) and covers it. */}
      <div className="relative aspect-16/10 overflow-hidden bg-[#140d08] sm:aspect-2/1 lg:aspect-auto lg:min-h-[21rem]">
        <picture>
          <source media="(min-width: 640px)" srcSet={wide} sizes={sizes} />
          {/* next/image's own props (getImageProps), in a <picture> for the two crops. */}
          <img {...img} srcSet={close} alt={ad.image.alt} className="absolute inset-0 h-full w-full object-cover" />
        </picture>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <p className="font-mono text-[0.7rem] font-bold tracking-[0.16em] text-[#f0a24b] uppercase">{ad.eyebrow}</p>
        <h2 id={headingId} className="mt-2 text-[1.65rem] leading-tight font-bold tracking-tight text-pretty text-slate-50 sm:text-3xl">
          {ad.heading}
        </h2>
        <p className="mt-3 leading-relaxed text-pretty text-[#9cadc5]">{ad.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={ad.play.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${ad.play.label} n8games (opens in a new tab)`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#f0a24b] px-5 text-sm font-bold text-slate-950 transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a24b]"
          >
            <FiPlay aria-hidden className="h-4 w-4 shrink-0" />
            {ad.play.label}
            <FiArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />
          </a>
          <Link
            href={ad.more.href}
            aria-label={`${ad.more.label} about n8games`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a24b]"
          >
            {ad.more.label}
            <FiArrowRight aria-hidden className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  )
}
