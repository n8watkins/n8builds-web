'use client'
import React, { type CSSProperties } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { LuBackpack } from 'react-icons/lu'
import { harnesses, inApps, loadout, workflow, type LoadoutGroup, type WorkflowStep } from '@/data/loadout'
import Reveal from '@/components/ui/Reveal'
import FadeIn from '@/components/ui/FadeIn'

/**
 * The Loadout (/loadout): the tools I use and what each one is for, not a
 * tech stack. It leads with how I work with AI (decide, build, fix: the tool
 * and model for each step), then the AI inside the apps I build, then the
 * physical setup in one section (rig, desk, stream).
 */

// A section's small mono path and title, left-aligned over its content.
const SectionHead = ({ id, path, title, children }: { id?: string; path: string; title: string; children?: React.ReactNode }) => (
  <div className="mb-6 flex flex-col gap-1.5">
    <span className="font-mono text-xs text-slate-475">{path}</span>
    <h2 id={id} className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">{title}</h2>
    {children && <p className="max-w-[620px] text-[15px] leading-relaxed text-[#9cadc5]">{children}</p>}
  </div>
)

/** One step of the workflow: its number and verb, the tool in its brand colour, the model, why. */
const StepCard = ({ step, index }: { step: WorkflowStep; index: number }) => (
  <article
    className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-(--brand)/40 hover:shadow-[0_18px_50px_-20px_var(--brand)] motion-reduce:hover:translate-y-0"
    style={{ '--brand': step.color } as CSSProperties}
  >
    {/* The brand's colour, glowing in from the top corner on hover */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-(--brand) opacity-[0.06] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.16]"
    />
    <p className="relative font-mono text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
      <span className="text-cyan-300">0{index + 1}</span> {step.step}
    </p>
    <div className="relative flex items-center gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#081427] p-3 text-(--brand) transition-transform duration-300 group-hover:scale-105">
        {step.icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-50">{step.tool}</h3>
        {step.model && (
          <span className="mt-1 inline-flex rounded-full border border-(--brand)/35 bg-(--brand)/10 px-2.5 py-0.5 text-xs font-semibold text-slate-100">
            {step.model}
          </span>
        )}
      </div>
    </div>
    <p className="relative text-[15px] leading-relaxed text-[#b4c2d6]">{step.whatFor}</p>
    <div className="relative mt-auto flex items-start gap-2 border-t border-white/6 pt-4">
      <span className="mt-0.5 shrink-0 font-mono text-xs text-(--brand)">{'//'}</span>
      <p className="font-mono text-[0.8rem] leading-relaxed text-slate-400">{step.take}</p>
    </div>
  </article>
)

/**
 * The physical setup in one place (the owner found three spec sheets
 * repetitive, 2026-10-27): a column each for the rig, the desk and the stream,
 * one line per item.
 */
const Setup = ({ groups }: { groups: LoadoutGroup[] }) => (
  <Reveal as="section" id="setup" aria-labelledby="setup-title" className="scroll-mt-24">
    <SectionHead id="setup-title" path="~/loadout/setup" title="The setup">
      What it all runs on, from the PC to the mic.
    </SectionHead>
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((group) => (
        <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-24 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <h3 id={`${group.id}-title`} className="font-mono text-xs font-bold tracking-[0.16em] text-cyan-300 uppercase">
            {group.title.replace(/^The /, '')}
          </h3>
          <ul className="mt-4 space-y-3.5">
            {group.items.map((item) => (
              <li key={item.name}>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-100">
                  {item.name}
                  {item.tag && (
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-cyan-300 uppercase">
                      {item.tag}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#9cadc5]">{item.whatFor}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </Reveal>
)

const Loadout = () => {
  const kit = ['rig', 'desk', 'stream'].flatMap((id) => loadout.filter((group) => group.id === id))
  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-screen overflow-hidden bg-darkBlue text-slate-100 focus:outline-none">
      {/* A soft glow behind the top of the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(55%_420px_at_50%_0,rgb(34_211_238/0.10),transparent_100%),radial-gradient(40%_380px_at_80%_160px,rgb(217_119_87/0.07),transparent_100%)]"
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-28 pb-10 sm:px-8 md:pt-32 md:pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to the bench
        </Link>

        {/* Header, in the Lab's style: above the fold, so a CSS fade (no waiting on hydration). */}
        <FadeIn className="mt-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/30 sm:h-16 sm:w-16">
              <LuBackpack className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">My Loadout</h1>
          </div>
          <p className="mt-5 max-w-[600px] text-balance text-lg text-[#9cadc5] sm:text-xl">
            The AI I work with and what each one is for, then the setup it all runs on.
          </p>
        </FadeIn>

        {/* How I work with AI: a sequence, so the steps are numbered and joined by arrows. */}
        <Reveal className="mt-16">
          <section id="workflow" aria-labelledby="workflow-title" className="scroll-mt-24">
          <SectionHead id="workflow-title" path="~/loadout/workflow" title="How I work with AI">
            One tool for each part of the job. A piece of work goes through them in this order.
          </SectionHead>
          <ol className="grid gap-5 lg:grid-cols-3 lg:gap-8">
            {workflow.map((step, i) => (
              <li key={step.step} className="relative">
                <StepCard step={step} index={i} />
                {i < workflow.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 -right-6 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0a1428] text-cyan-300 lg:flex"
                  >
                    <FiArrowRight className="h-4 w-4" />
                  </span>
                )}
              </li>
            ))}
          </ol>
          {/* The harnesses the models run in */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">Harnesses</span>
            <ul className="flex flex-wrap gap-3">
              {harnesses.map((h) => (
                <li key={h.name} className="rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2 text-sm text-[#9cadc5]">
                  <span className="font-semibold text-slate-100">{h.name}</span>: {h.whatFor}
                </li>
              ))}
            </ul>
          </div>
          </section>
        </Reveal>

        {/* The AI inside the apps I build */}
        <Reveal as="section" id="in-apps" className="mt-20 scroll-mt-24">
          <SectionHead path="~/loadout/in-apps" title="Inside the apps I build">
            What the AI in my own apps and extensions runs on.
          </SectionHead>
          <ul className="grid gap-4 md:grid-cols-3">
            {inApps.map((item) => (
              <li
                key={item.name}
                className="group flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all duration-200 hover:border-(--brand)/35 hover:bg-white/[0.04]"
                style={{ '--brand': item.color } as CSSProperties}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#081427] p-2.5 text-(--brand) transition-transform duration-200 group-hover:scale-105">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-100">{item.name}</h3>
                    {item.tag && (
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[0.62rem] font-bold tracking-wider text-cyan-300 uppercase">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#9cadc5]">{item.whatFor}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* The physical kit, in one section */}
        <div className="mt-20">
          <Setup groups={kit} />
        </div>

        <p className="mt-16 border-t border-white/6 pt-8 text-center font-mono text-xs text-slate-475">
          {"// the kit changes constantly - check back, it's always being re-rolled."}
        </p>
      </div>
    </main>
  )
}

export default Loadout
