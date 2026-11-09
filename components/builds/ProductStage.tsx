'use client'
import { useState, type ReactNode } from 'react'
import { FiArrowUpRight, FiMonitor, FiSmartphone } from 'react-icons/fi'
import { ProjectTour } from '@/components/sections/FeaturedProjectIslands'
import type { BuildClip } from '@/data/builds'

type Device = 'desktop' | 'phone'

/** The phone take's screen: an iPhone 14's width, as recorded (scripts/product-clips/). */
const PHONE = { width: 390, height: 760 }

/**
 * The product in use, full width under a build page's header (owner,
 * 2026-11-09): its clip, a short silent take of the product in real use
 * (scripts/product-clips/), and "Try it live", a plain link to the real
 * product in a new tab, on a page that needs no sign-up. Nothing is embedded.
 *
 * From 1024px a Desktop | Phone switch shows the desktop take in a browser
 * window or the phone take in a phone. Below 1024px there is no switch: a
 * phone gets the phone take and a tablet the desktop one.
 */
export default function ProductStage({
  name,
  clip,
  tryLive,
}: {
  name: string
  clip: BuildClip & { phone?: BuildClip }
  tryLive?: string
}) {
  const [device, setDevice] = useState<Device>('desktop')
  const phone = device === 'phone' && !!clip.phone

  return (
    <section id="demo" aria-label={`${name} in use`} className="scroll-mt-24">
      {/* From 1024px: the stage, with its switch. */}
      <div className="hidden lg:block" data-testid="product-stage">
        <div className="flex items-center justify-between gap-4">
          {tryLive ? <TryItLive name={name} href={tryLive} /> : <span />}
          {clip.phone ? (
            <div role="group" aria-label="Show it on" className="inline-flex shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-1">
              {(
                [
                  ['desktop', 'Desktop', <FiMonitor key="d" aria-hidden className="h-3.5 w-3.5" />],
                  ['phone', 'Phone', <FiSmartphone key="p" aria-hidden className="h-3.5 w-3.5" />],
                ] as [Device, string, ReactNode][]
              ).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={device === value}
                  onClick={() => setDevice(value)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                    device === value ? 'bg-blue-500/20 text-blue-100 ring-1 ring-blue-400/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-center">
          {phone && clip.phone ? (
            <div data-device="phone" className="rounded-[3rem] border border-white/15 bg-[#05080f] p-3 shadow-2xl shadow-black/50 ring-1 ring-black" style={{ width: PHONE.width + 26 }}>
              {/* The phone's status bar, with its camera island: the screen starts under it. */}
              <span aria-hidden className="flex h-9 items-center justify-center rounded-t-[2.25rem] bg-black">
                <span className="h-[1.35rem] w-24 rounded-full bg-[#111827] ring-1 ring-white/10" />
              </span>
              <div className="overflow-hidden rounded-b-[2.25rem]" style={{ height: PHONE.height }}>
                <ProjectTour title={name} tour={clip.phone} className="h-full w-full" frameClassName="" aspect="h-full" sizes={`${PHONE.width}px`} noun="clip" />
              </div>
            </div>
          ) : (
            <div data-device="desktop" className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1322] shadow-2xl shadow-black/40">
              <div className="flex h-11 items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.03] px-4" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <ProjectTour title={name} tour={clip} className="w-full" frameClassName="" sizes="(min-width: 1280px) 1152px, 100vw" noun="clip" />
            </div>
          )}
        </div>
      </div>

      {/* Below 1024px: the take for this screen, and the way to the real thing. */}
      <div className="lg:hidden" data-testid="product-stage-compact">
        <div className={clip.phone ? 'hidden sm:block' : ''}>
          <ProjectTour title={name} tour={clip} className="w-full" frameClassName="rounded-2xl border border-white/10 shadow-2xl shadow-black/40" sizes="100vw" noun="clip" />
        </div>
        {clip.phone ? (
          // As tall as most of the screen at most, so the page carries on below it.
          <div className="mx-auto sm:hidden" style={{ maxWidth: `calc(72svh * ${PHONE.width} / ${PHONE.height})` }}>
            <ProjectTour
              title={name}
              tour={clip.phone}
              className="w-full"
              aspect="aspect-[390/760]"
              frameClassName="rounded-[1.75rem] border border-white/10 shadow-2xl shadow-black/40"
              sizes="100vw"
              noun="clip"
            />
          </div>
        ) : null}
        {tryLive ? (
          <div className="mt-4 flex justify-center">
            <TryItLive name={name} href={tryLive} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** "Try it live": the real product, in a new tab. */
function TryItLive({ name, href }: { name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      <span aria-hidden className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      Try it live
      <FiArrowUpRight aria-hidden className="h-4 w-4" />
      <span className="sr-only"> ({name}, opens in a new tab)</span>
    </a>
  )
}
