import React from 'react'
import BubblingFlask from '@/components/ui/BubblingFlask'
import Hero from '@/components/sections/Hero'
import Navbar from '@/components/layout/Navbar'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import Reveal from '@/components/ui/Reveal'
import ScrollToTop from '@/components/ui/ScrollToTop'
import HomeEffects from '@/components/HomeEffects'
import NowBuilding from '@/components/sections/NowBuilding'
import BuildLogStrip from '@/components/sections/BuildLogStrip'
import FeaturedProjects from '@/components/sections/FeaturedProjects'
import UseAsTemplate from '@/components/sections/UseAsTemplate'
import PortfolioAd from '@/components/sections/PortfolioAd'
import UpcomingStrip from '@/components/sections/UpcomingStrip'
import NotionsStrip from '@/components/sections/NotionsStrip'
import ExtensionsShowcase from '@/components/sections/ExtensionsShowcase'
import LabSectionNav from '@/components/sections/LabSectionNav'
import ShimmerWhenSeen from '@/components/ShimmerWhenSeen'
import HomeStack from '@/components/sections/HomeStack'
import HomeLoadoutNav from '@/components/sections/HomeLoadoutNav'
import HomePeople from '@/components/sections/HomePeople'
import Footer from '@/components/layout/Footer'
import type { Post } from '@/lib/sanity'

/**
 * A full-width homepage band. Alternating tones and a hairline between bands
 * separate the sections, which otherwise ran together on one flat background.
 * The band right under the hero uses `fadeIn` instead: no hairline, and its
 * tone eases in, so the hero flows into it. Its content fades up as it scrolls
 * into view; a tall band (the Lab) passes `reveal={false}` and reveals its
 * parts one by one instead.
 */
function Band({
  id,
  tone = 'base',
  fadeIn = false,
  reveal = true,
  as: Tag = 'div',
  rail,
  children,
}: {
  id?: string
  tone?: 'base' | 'raised'
  fadeIn?: boolean
  reveal?: boolean
  as?: 'div' | 'section'
  /** A side rail for the band's parts (components/ui/SectionRail.tsx): it sits in the band, beside its content column. */
  rail?: React.ReactNode
  children: React.ReactNode
}) {
  const background = fadeIn
    ? 'bg-linear-to-b from-transparent to-white/[0.022] to-[260px]'
    : tone === 'raised'
      ? 'border-t border-white/[0.06] bg-white/[0.022]'
      : 'border-t border-white/[0.06]'
  return (
    // A band with a side rail is where its rail's first row lands: its top
    // edge right under the 69px navbar (as #lab), with no strip of the band above.
    <Tag id={id} className={`relative z-10 ${rail ? 'scroll-mt-[-11px]' : ''} ${background}`}>
      {rail}
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">{reveal ? <Reveal>{children}</Reveal> : children}</div>
    </Tag>
  )
}

/**
 * The homepage, rendered on the server. Only its interactive parts are client
 * components (islands): the navbar, the hero's grid and wire meter, the
 * carousels, the Lab rows' gallery and Details, the scroll reveals, the
 * contact form, and HomeEffects (analytics and the ambient glows). A phone
 * downloads and hydrates those, not every section's code.
 */
export default async function HomePage({ posts }: { posts: Post[] }) {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative w-full min-h-screen bg-linear-to-b from-darkBlue via-[#06101f] to-darkBlue focus:outline-none"
      >
        <HomeEffects />

        <SectionErrorBoundary sectionName="Hero Section">
          <Hero />
        </SectionErrorBoundary>

        {/* What I'm working on: flows straight out of the hero. */}
        <Band fadeIn>
          <SectionErrorBoundary sectionName="Currently Building">
            <NowBuilding />
          </SectionErrorBoundary>
        </Band>

        {/* What shipped lately, right under what I'm working on (owner, 2026-11-08;
             the Lab's first part from 2026-11-02). Hidden if the log can't load. */}
        <SectionErrorBoundary sectionName="Build Log">
          <BuildLogStrip />
        </SectionErrorBoundary>

        {/* ===== THE LAB: one section in parts, each in its own colour wash
             (app/globals.css, "The Lab's colour washes"): Featured
             (FeaturedProjects), the template offer, the Chrome extensions,
             then What's cookin'. No tools part: the owner's daily drivers
             (Scribe) are on /loadout (2026-11-01). The parts are full-bleed, so the
             Lab sets its own content width instead of using a Band. The navbar
             "Lab" menu and the side nav scroll to #lab and the part ids. ===== */}
        {/* Jumping to #lab (the navbar's Lab menu) lands its top edge right under the
             69px navbar, not 11px lower (html scroll-padding-top is 80px), so no strip
             of the band above shows between the two. */}
        <div id="lab" className="relative z-10 scroll-mt-[-11px]">
          {/* The cut into the Lab (round 4 of 2026-11-08: "a switch to a new section"): a
               cyan line, brightest in the middle and gone at the edges, over a soft glow
               that fades out within it. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(45%_100%_at_50%_0,rgb(34_211_238/0.09),transparent)]" />
          {/* Desktop only: a sticky rail in the left gutter marking the Lab part on screen. */}
          <LabSectionNav />
          <ShimmerWhenSeen />
          {/* The intro: a faint cyan glow behind the heading, drawn by its own layer that
               fades to nothing well inside its edges and reaches past the intro both
               ways, so there is no band and no seam above or below it (2026-11-08: a
               background on the short intro itself ended in hard edges). Centred
               across the full content width. */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[20rem] w-[min(64rem,100%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(34_211_238/0.075),rgb(34_211_238/0.03)_55%,transparent)]"
            />
            {/* Just the flask and "The Lab" (owner, 2026-11-08: no eyebrow, subtitle, points or pills). */}
            <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pt-14 pb-2 text-center sm:px-8 sm:pt-16">
              {/* The Lab's mark (the owner's pick, 2026-10-26): a flask in a chip like the rows' app icons. */}
              <div className="flex items-center gap-4 sm:gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/30 sm:h-16 sm:w-16">
                  <BubblingFlask className="h-7 w-7 sm:h-9 sm:w-9" />
                </span>
                <h2 className="text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">The Lab</h2>
              </div>
            </Reveal>
          </div>

          <SectionErrorBoundary sectionName="Featured Projects">
            <FeaturedProjects />
          </SectionErrorBoundary>

          {/* Right after the featured builds: building your own? Use mine as a template. */}
          <SectionErrorBoundary sectionName="Use as Template">
            <UseAsTemplate />
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Extensions">
            <Reveal>
              <ExtensionsShowcase />
            </Reveal>
          </SectionErrorBoundary>

          {/* The Lab's last part: what's cooking next, each with its landing page and
               waitlist (owner, 2026-11-01). The full detail lives on /upcoming. */}
          <SectionErrorBoundary sectionName="Upcoming">
            <Reveal>
              <UpcomingStrip />
            </Reveal>
          </SectionErrorBoundary>
        </div>

        {/* ===== THE PORTFOLIO AD: hiring after seeing the builds? One click. ===== */}
        <Band>
          <SectionErrorBoundary sectionName="Portfolio Ad">
            <PortfolioAd />
          </SectionErrorBoundary>
        </Band>

        {/* N8's Notions: latest blog posts */}
        <Band tone="raised">
          <SectionErrorBoundary sectionName="N8's Notions">
            <NotionsStrip posts={posts} />
          </SectionErrorBoundary>
        </Band>

        {/* People I follow, and The Pull Request Post right under them (moved from /loadout, 2026-11-01) */}
        <Band>
          <SectionErrorBoundary sectionName="People I Follow">
            <HomePeople />
          </SectionErrorBoundary>
        </Band>

        {/* Homepage stack, the homepage's Loadout: AI marquee + Turso TL;DR, the
             tools I built and use, and the dev setup teaser -> /loadout. Desktop
             only: a sticky rail in the left gutter marks its part on screen. */}
        <Band id="loadout-band" tone="raised" rail={<HomeLoadoutNav />}>
          <SectionErrorBoundary sectionName="My Stack">
            <HomeStack />
          </SectionErrorBoundary>
        </Band>

        {/* The contact form animates its own fields in. */}
        <Band id="contact" as="section" reveal={false}>
          <SectionErrorBoundary sectionName="Contact Section">
            <Footer />
          </SectionErrorBoundary>
        </Band>

        <ScrollToTop />
      </main>
    </>
  )
}
