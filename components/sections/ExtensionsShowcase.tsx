import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import StarButton from '@/components/ui/StarButton'
import { getBuild } from '@/data/builds'
import LabSubheader from '@/components/sections/LabSubheader'
import ExtensionsCarousel from '@/components/sections/ExtensionsCarousel'

interface Ext {
  slug: string
  icon: string
  shot: string | null
  oss: boolean
  blurb: string
}

// The 3 extensions to push (open source - ask for stars). Details derive from builds.tsx.
const exts: Ext[] = [
  {
    slug: 'piper-tts',
    icon: '/builds/piper-tts/icon.png',
    shot: '/builds/piper-tts/popup.png',
    oss: true,
    blurb: 'Highlight text, right-click, hear it read aloud by a Piper model running fully on your machine. No cloud, no keys.',
  },
  {
    slug: 'tubevault',
    icon: '/builds/tubevault/icon.png',
    shot: '/builds/tubevault/tubevault-popup.png',
    oss: true,
    blurb: 'Archive YouTube videos, playlists, and channels locally with a yt-dlp helper. Your library, on your disk.',
  },
  {
    slug: 'tldw',
    icon: '/builds/tldw/icon.png',
    shot: null,
    oss: true,
    blurb: 'On any YouTube video, hit Alt+G - it opens Gemini with a saved prompt and the video, and submits. Too Long; Didn\'t Watch.',
  },
]

const Detail = ({ ext }: { ext: Ext }) => {
  const build = getBuild(ext.slug)
  if (!build) return null
  return (
    <div className="grid gap-6 md:grid-cols-2 md:items-center">
      {/* Visual */}
      <a
        href={build.github}
        target="_blank"
        rel="noopener noreferrer"
        className="group/visual relative block aspect-16/10 overflow-hidden rounded-2xl border border-white/8 bg-[#07101d]"
      >
        {ext.shot ? (
          <Image
            src={ext.shot}
            alt={`${build.name} screenshot`}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover/visual:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#0a1a33] to-[#081427]">
            <Image src={ext.icon} alt={`${build.name} icon`} width={88} height={88} className="rounded-2xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-darkBlue/50 to-transparent" />
      </a>

      {/* Text */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Image src={ext.icon} alt="" width={36} height={36} className="rounded-xl" />
          <div>
            <h3 className="text-xl font-extrabold leading-tight text-slate-50">{build.name}</h3>
            <p className="text-sm text-slate-400">{build.tagline}</p>
          </div>
        </div>
        <p className="text-[#9cadc5] leading-relaxed">{ext.blurb}</p>
        <div className="flex flex-wrap gap-1.5">
          {build.tags.map((t) => (
            <span key={t} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {build.github && <StarButton href={build.github} name={build.name} />}
          <Link
            href={`/builds/${build.slug}`}
            className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
          >
            Read more<span className="sr-only"> about {build.name}</span>
            <FiArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * The Lab's Chrome extensions, rendered on the server. On desktop the three
 * cards and the detail panel cycle in a client island (ExtensionsCarousel),
 * which gets each detail already rendered; on phones they simply stack.
 */
const ExtensionsShowcase = () => (
  <section id="extensions" aria-label="Chrome extensions" className="py-10">
    <LabSubheader
      eyebrow="Browser tools"
      eyebrowClass="text-indigo-400"
      title="Chrome extensions"
      blurb={<>Small, local-first tools I built and actually use. All open source - if one&apos;s useful, a star helps a ton.</>}
    />

    {/* ===== Desktop: 3 side-by-side + auto-cycle detail ===== */}
    <ExtensionsCarousel
      cards={exts.map((ext) => {
        const build = getBuild(ext.slug)
        return { slug: ext.slug, icon: ext.icon, name: build?.name, tagline: build?.tagline }
      })}
      details={exts.map((ext) => (
        <Detail key={ext.slug} ext={ext} />
      ))}
    />

    {/* ===== Mobile: stacked, each with its detail (no hover/cycle) ===== */}
    <div className="flex flex-col gap-5 md:hidden">
      {exts.map((ext) => (
        <div key={ext.slug} className="rounded-2xl border border-white/8 bg-white/2 p-5">
          <Detail ext={ext} />
        </div>
      ))}
    </div>
  </section>
)

export default ExtensionsShowcase
