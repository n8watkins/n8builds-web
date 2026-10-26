'use client'

import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'my-tools', label: 'My tools' },
  { id: 'featured', label: 'Featured' },
  // Shortened to "Extensions" on screen where the gutter is too narrow for
  // the full label on one line (1440-1535px); its accessible name stays whole.
  { id: 'extensions', label: 'Chrome extensions', short: 'Extensions' },
] as const satisfies readonly { id: string; label: string; short?: string }[]

type SectionId = (typeof SECTIONS)[number]['id']

/**
 * The Lab's floating side nav: My tools, Featured, Chrome extensions, with the
 * part on screen highlighted. Desktop only (from 1280px), in the left gutter
 * beside the Lab's content column.
 *
 * Layout is pure CSS: an absolute column spanning the whole Lab band holds a
 * sticky rail, so the rail only shows while the Lab is on screen and never
 * leaves it, and being absolute it can't shift the layout. The links are plain
 * anchors (server-rendered, so they work without JS); the page's own
 * scroll-padding-top and reduced-motion-aware smooth scrolling handle the jump.
 * The only script is the IntersectionObserver that marks the current part.
 *
 * Two shapes: from 1440px the gutter fits the labels beside the content (they
 * never wrap: a long one shows its short form if it must); between 1280px and
 * 1440px it is a slim rail with the labels set vertically.
 */
export default function LabSectionNav() {
  const [active, setActive] = useState<SectionId | null>(null)

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
    if (!targets.length) return
    // A thin line at 40% of the viewport: the part crossing it is current. In a
    // gap between parts the last one stays marked; above the first, none is.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId
          if (entry.isIntersecting) {
            setActive(id)
          } else if (id === SECTIONS[0].id && entry.boundingClientRect.top > 0) {
            setActive((current) => (current === id ? null : current))
          }
        }
      },
      { rootMargin: '-40% 0px -60% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-72rem)/2+2rem)] xl:block"
      data-testid="lab-section-nav"
    >
      <nav
        aria-label="Lab contents"
        className="pointer-events-auto sticky top-28 mt-8 ml-auto mr-4 w-fit 2xl:mr-6"
      >
        <p className="mb-3 hidden font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-450 min-[90rem]:block">
          In the Lab
        </p>
        <ul className="flex flex-col gap-1 border-l border-white/10 min-[90rem]:gap-0.5">
          {SECTIONS.map((s) => {
            const current = active === s.id
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={current ? 'location' : undefined}
                  className={`-ml-px flex min-h-6 rotate-180 whitespace-nowrap items-center border-r-2 px-1 py-2 font-mono text-xs tracking-wide transition-colors duration-200 [writing-mode:vertical-rl] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 min-[90rem]:rotate-0 min-[90rem]:border-r-0 min-[90rem]:border-l-2 min-[90rem]:py-1 min-[90rem]:pl-3 min-[90rem]:[writing-mode:horizontal-tb] ${
                    current
                      ? 'border-cyan-300 text-cyan-200'
                      : 'border-transparent text-slate-450 hover:border-white/30 hover:text-slate-200'
                  }`}
                >
                  {'short' in s ? (
                    <>
                      <span className="min-[90rem]:max-2xl:sr-only">{s.label}</span>
                      <span aria-hidden="true" className="hidden min-[90rem]:max-2xl:inline">
                        {s.short}
                      </span>
                    </>
                  ) : (
                    s.label
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
