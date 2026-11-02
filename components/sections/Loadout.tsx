import React, { type CSSProperties } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { LuBackpack } from 'react-icons/lu'
import { harnesses, inApps, loadout, loadoutParts, workflow, type LoadoutGroup, type WorkflowStep } from '@/data/loadout'
import Reveal from '@/components/ui/Reveal'
import FadeIn from '@/components/ui/FadeIn'
import {
  BuiltToolsGrid,
  DevSetup,
  SectionHead,
  TOOLS_I_BUILT_BLURB,
  TOOLS_I_BUILT_TITLE,
  ToolsIUse,
} from '@/components/sections/LoadoutDevTools'
import { DailyDriverRows } from '@/components/sections/FeaturedProjects'
import LoadoutSectionNav from '@/components/sections/LoadoutSectionNav'
import BuildStacks from '@/components/sections/BuildStacks'

// A server component, so react-icons don't get the app's IconContext
// (aria-hidden by default, app/provider.tsx): every icon here is hidden from
// assistive tech by its wrapper or its own aria-hidden.

/**
 * The Loadout (/loadout): the tools I use and what each one is for. It
 * leads with how I work with AI (decide, build, fix: the tool and model for
 * each step), after my dev setup, then the AI inside the apps I build (it is
 * about AI too, the owner's call, 2026-11-02) and the stacks I build with
 * (how I build, back the same day), then the tools I built and
 * use (Scribe, out of the homepage Lab, then the small CLIs, 2026-11-01;
 * before the ones I use), the tools I use (honorable mentions included,
 * 2026-11-02), and the gear in one section
 * (rig, desk, stream kit). The people I follow moved to the homepage
 * (2026-11-01). A server component: its
 * interactive parts (the scroll reveals) are client islands.
 */

/** The page's content column (Scribe's row runs full-bleed, out of it, in Tools I built and use). */
const column = 'relative mx-auto max-w-6xl px-5 sm:px-8'

// The page's parts (loadoutParts) are the pills under the header (like the
// Lab's), in page order: the same list as the side rail's. Each part's id sits
// on a plain wrapper (Part), never on its scroll reveal or fade: a jump works
// out where to land while the reveal still holds the part 24px low, so it
// ended up under the navbar.

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
      <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#081427] p-3 text-(--brand) transition-transform duration-300 group-hover:scale-105">
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
    <p className="relative text-[15px] leading-relaxed text-pretty text-[#b4c2d6]">{step.whatFor}</p>
    <div className="relative mt-auto flex items-start gap-2 border-t border-white/6 pt-4">
      <span className="mt-0.5 shrink-0 font-mono text-xs text-(--brand)">{'//'}</span>
      <p className="font-mono text-[0.8rem] leading-relaxed text-pretty text-slate-400">{step.take}</p>
    </div>
  </article>
)

/**
 * The gear in one place (the owner found three spec sheets repetitive,
 * 2026-10-27): a column each for the rig and the desk, one line per item.
 * Called "The setup" until 2026-11-01, renamed so it doesn't clash with "My
 * dev setup". The stream kit (OBS, Scribe) left on 2026-11-02 (round 3);
 * Scribe is in Tools I built and use.
 */
const Gear = ({ groups }: { groups: LoadoutGroup[] }) => (
  // Reveal renders no aria attributes, so the labelled section sits inside it.
  <Reveal>
    <section aria-labelledby="gear-title">
    <SectionHead id="gear-title" part="gear" path="~/loadout/gear" title="The gear">
      What it all runs on, from the PC to the mic.
    </SectionHead>
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group, g) => (
        <Reveal key={group.id} delay={g * 0.1}>
          <section
            id={group.id}
            aria-labelledby={`${group.id}-title`}
            className="h-full scroll-mt-24 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-cyan-300/25 motion-reduce:hover:translate-y-0"
          >
            <h3 id={`${group.id}-title`} className="font-mono text-xs font-bold tracking-[0.16em] text-cyan-300 uppercase">
              {group.title.replace(/^The /, '')}
            </h3>
            <ul className="mt-4 space-y-3.5">
              {group.items.map((item) => (
                <li key={item.name} className="group/item flex gap-3">
                  {/* The mark alone, centred on the name's line, as My dev setup's chips (owner, 2026-11-02: no box
                      around it), a size up since round 3 so it reads at a glance. */}
                  <span
                    aria-hidden="true"
                    data-gear-icon
                    className="flex h-6 w-8 shrink-0 items-center justify-center text-slate-300 transition-colors group-hover/item:text-cyan-200 [&_img]:size-5 [&_img]:rounded-[4px] [&_svg]:size-5"
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-balance text-slate-100">
                      {item.name}
                      {item.tag && (
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-cyan-300 uppercase">
                          {item.tag}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-pretty text-[#9cadc5]">{item.whatFor}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
    </section>
  </Reveal>
)

/**
 * One part of the page as a full-width band (the owner's asks, 2026-11-02:
 * scrolling should clearly move from one part to the next, and in round 3
 * more polished than a hairline): a rule in the part's colour that fades at
 * both ends opens it, its wash glows behind its chapter heading and eases in
 * and out at the band's ends, and every other part sits on a raised tone that
 * eases in and out too (`.loadout-part` in app/globals.css), with generous
 * room above and below. Its id sits here, on a plain wrapper, never on a
 * scroll reveal (see the note above StepCard). `bleed` lets a part's content
 * set its own width (Scribe's full-bleed row); otherwise it sits in the
 * content column.
 */
const Part = ({ id, bleed = false, children }: { id: string; bleed?: boolean; children: React.ReactNode }) => {
  const index = loadoutParts.findIndex((part) => part.id === id)
  return (
    <div
      id={id}
      data-loadout-part
      className={`loadout-part py-20 md:py-28 ${index % 2 ? 'loadout-part-raised' : ''}`}
      style={{ '--lo': loadoutParts[index].accent } as CSSProperties}
    >
      <div aria-hidden="true" data-part-rule className="loadout-part-rule" />
      {bleed ? children : <div className={column}>{children}</div>}
    </div>
  )
}

const Loadout = () => {
  const kit = ['rig', 'desk'].flatMap((id) => loadout.filter((group) => group.id === id))
  return (
    // Clipped, not overflow-hidden: a hidden overflow is a scroll container,
    // which would stop the side rail sticking.
    <main id="main-content" tabIndex={-1} className="relative min-h-screen overflow-clip bg-darkBlue text-slate-100 focus:outline-none">
      {/* Desktop only: a sticky rail in the left gutter marking the part on screen. */}
      <LoadoutSectionNav />
      {/* A soft glow behind the top of the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(55%_420px_at_50%_0,rgb(34_211_238/0.10),transparent_100%),radial-gradient(40%_380px_at_80%_160px,rgb(217_119_87/0.07),transparent_100%)]"
      />
      <div className={`${column} pt-28 pb-16 md:pt-32 md:pb-20`}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
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
            My dev setup, the AI I work with, the tools I built and use, and the gear it all runs on.
          </p>
          {/* Each pill carries its part's icon, in its colour, as the part's heading and the rail do. */}
          <nav aria-label="Loadout sections" className="mt-7 flex max-w-[760px] flex-wrap justify-center gap-2">
            {loadoutParts.map(({ id, label, icon: Icon, accent }) => (
              <a
                key={id}
                href={`#${id}`}
                style={{ '--lo': accent } as CSSProperties}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/4 px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-[rgb(var(--lo)/0.45)] hover:bg-white/[0.07] hover:text-slate-100"
              >
                <Icon aria-hidden="true" className="size-3.5 shrink-0 text-[rgb(var(--lo))]" />
                {label}
              </a>
            ))}
          </nav>
        </FadeIn>
      </div>

      {/* My dev setup first: the machine and everything on it, at a glance.
           Just under the header, so it fades in with it (no scroll reveal). */}
      <Part id="dev-setup">
        <FadeIn delay={0.1}>
          <DevSetup />
        </FadeIn>
      </Part>

      {/* How I work with AI: a sequence, so the steps are numbered and joined by arrows. */}
      <Part id="workflow">
        <Reveal>
          <section aria-labelledby="workflow-title">
            <SectionHead id="workflow-title" part="workflow" path="~/loadout/workflow" title="How I work with AI">
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
      </Part>

      {/* The AI inside the apps I build: about AI too, so right after How I work with AI. */}
      <Part id="in-apps">
        <Reveal>
          <section aria-labelledby="in-apps-title">
            <SectionHead id="in-apps-title" part="in-apps" path="~/loadout/in-apps" title="Inside the apps I build">
              What the AI in my own apps and extensions runs on.
            </SectionHead>
            <ul className="grid gap-4 md:grid-cols-3">
              {inApps.map((item) => (
                <li
                  key={item.name}
                  className="group flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all duration-200 hover:border-(--brand)/35 hover:bg-white/[0.04]"
                  style={{ '--brand': item.color } as CSSProperties}
                >
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#081427] p-2.5 text-(--brand) transition-transform duration-200 group-hover:scale-105">
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
                    <p className="mt-1 text-sm leading-relaxed text-pretty text-[#9cadc5]">{item.whatFor}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </Part>

      {/* The named stacks I build with: how I build (back on 2026-11-02). */}
      <Part id="stacks">
        <section aria-labelledby="stacks-title">
          <Reveal>
            <SectionHead id="stacks-title" part="stacks" path="~/loadout/stacks" title="Stacks I build with">
              Named combos, not a flat list: the tools that go together for each kind of project.
            </SectionHead>
          </Reveal>
          <BuildStacks />
        </section>
      </Part>

      {/* The tools I built and use, in two groups (round 3 of 2026-11-02): the
           dev tools, led by Scribe as the Lab's row (FeaturedProjects.tsx), out of
           the content column so its colour wash reaches the page edge (the row
           sets the column inside), then the other things I built. The cards are
           Tools I use's. */}
      <Part id="tools-i-built" bleed>
        {/* "My daily drivers" (#daily-drivers) was its own part for a day:
             links to it still land here. */}
        <span id="daily-drivers" aria-hidden="true" className="block" />
        <section aria-labelledby="tools-i-built-title">
          <Reveal className={column}>
            <SectionHead id="tools-i-built-title" part="tools-i-built" path="~/loadout/built" title={TOOLS_I_BUILT_TITLE}>
              {TOOLS_I_BUILT_BLURB}
            </SectionHead>
          </Reveal>
          <Reveal>
            <BuiltToolsGrid
              column={column}
              lead={
                // Pulled up to the subheading: the row's padding is its wash's room.
                <div className="-mt-5 md:-mt-7">
                  <DailyDriverRows />
                </div>
              }
            />
          </Reveal>
        </section>
      </Part>

      {/* The tools I use and recommend (their makers link to People I follow, on the homepage) */}
      <Part id="tools-i-use">
        {/* "Honorable mentions" (#honorable-mentions) joined Tools I use
             (2026-11-02): links to it still land here. */}
        <span id="honorable-mentions" aria-hidden="true" className="block" />
        <ToolsIUse />
      </Part>

      {/* The gear (rig, desk), in one section */}
      <Part id="gear">
        {/* The old anchors, so /loadout#setup and #stream (the stream kit's, gone
             since round 3 of 2026-11-02) links already out there still land here. */}
        <span id="setup" aria-hidden="true" className="block" />
        <span id="stream" aria-hidden="true" className="block" />
        <Gear groups={kit} />
        <p className="mt-16 border-t border-white/6 pt-8 text-center font-mono text-xs text-slate-475">
          {"// the kit changes constantly - check back, it's always being re-rolled."}
        </p>
      </Part>
    </main>
  )
}

export default Loadout
