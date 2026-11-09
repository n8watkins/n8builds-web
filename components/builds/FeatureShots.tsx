'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FiCheck } from 'react-icons/fi'
import { LightboxThumb, type LightboxImage } from '@/components/builds/Lightbox'

export interface Feature {
  text: string
  /** The screenshot that shows it, as an index into the page's images; none when there isn't one. */
  shot?: number
}

/**
 * What a build does, each feature beside its own screenshot (owner,
 * 2026-11-08). From 1024px the features are a list on the left and the
 * screenshot panel on the right: hovering, focusing or clicking a feature
 * shows its screenshot, and the screenshot opens large in the lightbox
 * (LightboxGallery, around this on the page). Narrower, each feature with a
 * screenshot carries a thumbnail that opens it. Features without one are plain
 * checks.
 */
export default function FeatureShots({ features, images }: { features: Feature[]; images: LightboxImage[] }) {
  const first = features.find((f) => f.shot !== undefined)?.shot
  const [shown, setShown] = useState(first)
  const hasShots = first !== undefined

  const check = <FiCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
  return (
    <div className={hasShots ? 'lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10' : ''}>
      <ul className={`grid gap-1.5 ${hasShots ? '' : 'gap-x-8 gap-y-2.5 sm:grid-cols-2'}`}>
        {features.map((feature) => {
          const active = feature.shot !== undefined && feature.shot === shown
          if (feature.shot === undefined) {
            return (
              <li key={feature.text} className={`flex items-start gap-2.5 text-[0.95rem] leading-snug text-slate-200 ${hasShots ? 'py-1.5 lg:px-3 lg:py-2.5' : ''}`}>
                {check}
                {feature.text}
              </li>
            )
          }
          const shot = feature.shot
          return (
            <li key={feature.text} className="flex items-center gap-3">
              {/* From 1024px: picks the panel's screenshot. */}
              <button
                type="button"
                aria-pressed={active}
                onMouseEnter={() => setShown(shot)}
                onFocus={() => setShown(shot)}
                onClick={() => setShown(shot)}
                className={`hidden w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[0.95rem] leading-snug transition-colors duration-200 lg:flex ${
                  active
                    ? 'border-cyan-400/30 bg-cyan-400/[0.07] text-slate-50'
                    : 'border-transparent text-slate-200 hover:border-white/10 hover:bg-white/4'
                }`}
              >
                {check}
                <span className="flex-1">{feature.text}</span>
                <span className="sr-only"> (shows its screenshot)</span>
              </button>
              {/* Narrower: the feature, and a thumbnail that opens its screenshot. */}
              <span className="flex flex-1 items-start gap-2.5 py-1.5 text-[0.95rem] leading-snug text-slate-200 lg:hidden">
                {check}
                {feature.text}
              </span>
              <LightboxThumb index={shot} label={images[shot].alt} className="w-24 shrink-0 rounded-lg border border-white/10 bg-white/3 sm:w-28 lg:hidden">
                <span className="relative block aspect-16/10">
                  <Image src={images[shot].src} alt="" fill sizes="112px" className="object-cover object-top" />
                </span>
              </LightboxThumb>
            </li>
          )
        })}
      </ul>
      {hasShots && shown !== undefined && (
        <div className="sticky top-24 hidden lg:block">
          <LightboxThumb index={shown} label={images[shown].alt} className="w-full rounded-2xl border border-white/10 bg-[#07101d]">
            <span className="relative block aspect-16/10">
              {/* Every feature's screenshot is in place, the shown one opaque, so switching is a crossfade with nothing to load. */}
              {features
                .filter((f) => f.shot !== undefined)
                .map((f) => (
                  <Image
                    key={f.shot}
                    src={images[f.shot!].src}
                    alt={f.shot === shown ? images[f.shot!].alt : ''}
                    aria-hidden={f.shot === shown ? undefined : true}
                    fill
                    sizes="(min-width: 1024px) 560px, 0px"
                    className={`object-contain transition-[opacity,scale] duration-300 group-hover/shot:scale-[1.015] motion-reduce:transition-none ${
                      f.shot === shown ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
            </span>
          </LightboxThumb>
          <p className="mt-2.5 text-center text-xs text-slate-450">{images[shown].alt}</p>
        </div>
      )}
    </div>
  )
}
