'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import HeroPortraitSwap from '@/components/sections/HeroPortraitSwap'
import { PORTRAIT_BLUR } from '@/components/sections/heroPortraitBlur'

/**
 * The hero portrait's photo, over a real placeholder.
 *
 * The circle's own background is a tiny blurred copy of the portrait (generated
 * from the photo: scripts/gen-portrait-blur.mjs), so on a slow first visit the
 * entrance reveals a soft version of the face, never a black disc. It is the
 * wrapper's background, not next/image's `placeholder`, so the photo can fade
 * over it. The photo is in the server HTML and visible by default (no
 * JavaScript needed): once hydrated, a photo that has not arrived yet is held
 * transparent and fades in over the placeholder when it loads, instead of
 * popping in. A photo that is already there (cache, fast network) is not held.
 * data: images are never an LCP candidate, so the photo stays the LCP element.
 */
export default function HeroPortraitPhoto({ sizes }: { sizes: string }) {
  const wrapper = useRef<HTMLDivElement>(null)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    const img = wrapper.current?.querySelector('img')
    // Read once on mount from the DOM: the photo's state is outside React.
    if (img && !img.complete) setWaiting(true)
  }, [])

  return (
    <div
      ref={wrapper}
      data-portrait-frame=""
      data-waiting={waiting ? '' : undefined}
      className="relative w-full h-full rounded-full bg-cover bg-center"
      style={{ backgroundImage: `url("${PORTRAIT_BLUR}")` }}
    >
      <div className="absolute inset-0 dark:bg-black/10 rounded-full z-10" />
      <Image
        src="/hero/portrait.jpg"
        className="hero-portrait-photo rounded-full object-cover ring-1 ring-white/10"
        fill
        // The LCP element: preloaded and fetched at high priority. Next
        // 16's `priority` preloaded it at the browser's default (low)
        // priority for images, behind the scripts, on a slow phone.
        preload
        loading="eager"
        fetchPriority="high"
        sizes={sizes}
        alt="Nathan Watkins - builder based in Los Angeles"
        onLoad={() => setWaiting(false)}
      />
      {/* The watercolor version fades in and out over the photo, once
          the page has loaded (never under reduced motion). */}
      <HeroPortraitSwap sizes={sizes} />
    </div>
  )
}
