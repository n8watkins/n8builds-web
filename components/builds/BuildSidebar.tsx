'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'
import { TechGlyph, TECH, type TechKey } from '@/lib/tech-icons'

/** What the sidebar says about a build: computed on the server (app/builds/[slug]/page.tsx). */
export type BuildFacts = {
  name: string
  category: string
  status?: string
  live?: { href: string; label: string }
  tech: TechKey[]
  license?: string
  version?: string
  /** "Nov 8, 2026". */
  lastShipped?: string
  repo?: { href: string; label: string }
}

/** The page's parts, in order: the ones found on the page are listed. */
export type PagePart = { id: string; label: string }

/**
 * A build page's sidebar (owner, 2026-11-09), in the spirit of the homepage
 * Lab's section nav: from 1024px it sits beside the story and stays in view as
 * you read, with the build's basics (what it is, whether it's live, its
 * stack, license, version and last ship, its repo) over links to each part of
 * the page, the part you are reading lit. Below 1024px the same basics fold
 * into one "At a glance" panel under the product (BuildFactsPanel), and the
 * links are left out: the page is one column you scroll anyway.
 */
export default function BuildSidebar({ facts, parts }: { facts: BuildFacts; parts: PagePart[] }) {
  const active = useCurrentPart(parts)
  return (
    <aside aria-label={`${facts.name} at a glance`} className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto pb-6 lg:block" data-testid="build-sidebar">
      <FactList facts={facts} />
      {parts.length > 1 ? (
        <nav aria-label="On this page" className="mt-7 border-t border-white/[0.07] pt-5">
          <p className="font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-slate-450 uppercase">On this page</p>
          <ul className="relative mt-3 space-y-0.5 border-l border-white/[0.08]">
            {parts.map((part) => {
              const current = part.id === active
              return (
                <li key={part.id}>
                  <a
                    href={`#${part.id}`}
                    aria-current={current ? 'location' : undefined}
                    className={`-ml-px block border-l-2 py-1.5 pl-3.5 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 ${
                      current ? 'border-cyan-300 font-semibold text-cyan-200' : 'border-transparent text-slate-400 hover:border-white/25 hover:text-slate-200'
                    }`}
                  >
                    {part.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
    </aside>
  )
}

/** Below 1024px: the same basics, folded into one panel. */
export function BuildFactsPanel({ facts }: { facts: BuildFacts }) {
  return (
    <details className="group mt-8 rounded-2xl border border-white/8 bg-white/3 lg:hidden" data-testid="build-facts-panel">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-100 [&::-webkit-details-marker]:hidden">
        {facts.name} at a glance
        <span aria-hidden className="text-lg leading-none text-slate-400 transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-white/[0.07] px-5 pt-4 pb-5">
        <FactList facts={facts} />
      </div>
    </details>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2.5 first:pt-0">
      <dt className="font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-slate-450 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-200">{children}</dd>
    </div>
  )
}

function FactList({ facts }: { facts: BuildFacts }) {
  const link = 'inline-flex items-center gap-1 font-semibold text-cyan-200 hover:text-cyan-100'
  return (
    <dl className="divide-y divide-white/[0.06]">
      <Fact label="What it is">
        {facts.category}
        {facts.status ? <span className="text-slate-400">, {facts.status}</span> : null}
      </Fact>
      {facts.live ? (
        <Fact label="Live at">
          <a href={facts.live.href} target="_blank" rel="noopener noreferrer" className={`${link} break-all`}>
            <span aria-hidden className="mr-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
            {facts.live.label}
            <FiArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Fact>
      ) : null}
      {facts.tech.length > 0 ? (
        <Fact label="Stack">
          {/* Each technology's mark, named on hover and to screen readers: the full cards are in How it's built. */}
          <ul aria-label={`${facts.name}'s stack`} className="mt-1.5 flex flex-wrap gap-1.5">
            {facts.tech.map((t) => (
              <li key={t} title={TECH[t].label} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-[#0a1428]">
                <TechGlyph tech={t} className="h-4 w-4" />
                <span className="sr-only">{TECH[t].label}</span>
              </li>
            ))}
          </ul>
        </Fact>
      ) : null}
      {facts.license ? <Fact label="License">{facts.license}</Fact> : null}
      {facts.version || facts.lastShipped ? (
        <Fact label={facts.version ? 'Version' : 'Last shipped'}>
          {facts.version ? <span className="font-mono">{facts.version}</span> : null}
          {facts.version && facts.lastShipped ? <span className="text-slate-400">, last shipped {facts.lastShipped}</span> : facts.lastShipped}
        </Fact>
      ) : null}
      {facts.repo ? (
        <Fact label="Source">
          <a href={facts.repo.href} target="_blank" rel="noopener noreferrer" className={link}>
            <FiGithub aria-hidden className="h-3.5 w-3.5" />
            {facts.repo.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Fact>
      ) : null}
    </dl>
  )
}

/**
 * The part being read: the last one whose top has passed the upper third of
 * the window (the first until then). One scroll listener, throttled to a frame.
 */
function useCurrentPart(parts: PagePart[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(parts[0]?.id)
  useEffect(() => {
    const els = parts.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight / 3
      let current = els[0].id
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id
      // At the very bottom the last part is the one being read, however short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = els[els.length - 1].id
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [parts])
  return active
}
