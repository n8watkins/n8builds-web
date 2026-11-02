import React from 'react'
import { FiCheck } from 'react-icons/fi'
import { LuCookingPot, LuScrollText, LuStar } from 'react-icons/lu'
import { SiGooglechrome } from 'react-icons/si'
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
import WorkWithMe from '@/components/sections/WorkWithMe'
import Footer from '@/components/layout/Footer'
import type { Post } from '@/lib/sanity'
import { hasBuildLog } from '@/lib/build-log'

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
  // The build log part hides when the log can't load; its pill goes with it.
  const buildLog = await hasBuildLog()
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

        {/* ===== THE LAB: one section in parts, each in its own colour wash
             (app/globals.css, "The Lab's colour washes"): the build log
             (BuildLogStrip, hidden if the log can't load), Featured
             (FeaturedProjects), the template offer, the Chrome extensions,
             then What's cookin'. No tools part: the owner's daily drivers
             (Scribe) are on /loadout (2026-11-01). The parts are full-bleed, so the
             Lab sets its own content width instead of using a Band. The navbar
             "Lab" menu and the side nav scroll to #lab and the part ids. ===== */}
        {/* Jumping to #lab (the navbar's Lab menu) lands its top edge right under the
             69px navbar, not 11px lower (html scroll-padding-top is 80px), so no strip
             of the band above shows between the two. */}
        <div id="lab" className="relative z-10 scroll-mt-[-11px] border-t border-white/[0.06]">
          {/* Desktop only: a sticky rail in the left gutter marking the Lab part on screen. */}
          <LabSectionNav />
          <ShimmerWhenSeen />
          {/* The intro picks up the raised tone the band above ends on and eases it out,
               so the top of the Lab has no lighter strip under the navbar; a faint cyan
               glow sits behind the heading. Centred across the full content width. */}
          <div className="bg-[radial-gradient(50%_320px_at_50%_0,rgb(34_211_238/0.08),transparent_100%),linear-gradient(to_bottom,rgb(255_255_255/0.022),transparent_220px)]">
            <Reveal className="mx-auto flex max-w-6xl flex-col items-center px-5 pt-16 pb-6 text-center sm:px-8 sm:pt-20">
              {/* "Check out" spans exactly the flask and title below it: its
                   letters spread across that width (the owner's ask, 2026-10-27;
                   "Check out the Lab" until 2026-11-01, now just "Check out").
                   Since 2026-11-02 the letters are larger and closer together
                   (owner: "larger letters, less space between them, but still
                   spaced out"). */}
              <div className="inline-flex flex-col items-stretch">
                {/* One line of text (no per-letter spans). The paragraph is a size
                     container as wide as the title row (it adds no width of its own).
                     The text is sized from that width (13cqw since round 5 of
                     2026-11-02, was 11.5cqw: "a bit closer together, slightly larger";
                     in a monospace font 9 characters are about 70% of it), and the letter spacing fills
                     the rest: 8 gaps of (100cqw - 9ch) / 8, about 0.3em, so it
                     still spans the row exactly. The word space is pulled in by
                     0.4ch (so the two words don't drift apart), and that 0.4ch goes
                     back to the gaps. The last letter's trailing spacing is taken
                     back with a margin. */}
                <p className="lab-eyebrow mb-2 font-mono font-bold uppercase leading-none [container-type:inline-size] sm:mb-3">
                  <span className="block w-max text-[13cqw] leading-none tracking-[calc((100cqw-8.6ch)/8)] [word-spacing:-0.4ch] [margin-right:calc((8.6ch-100cqw)/8)]">
                    Check out
                  </span>
                </p>
                {/* The Lab's mark (the owner's pick, 2026-10-26): a flask in a chip like the rows' app icons. */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/30 sm:h-16 sm:w-16">
                    <BubblingFlask className="h-7 w-7 sm:h-9 sm:w-9" />
                  </span>
                  <h2 className="text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">The Lab</h2>
                </div>
              </div>
              {/* One line from laptop width up; wraps naturally on phones. */}
              <p className="mt-5 text-balance text-lg text-[#9cadc5] sm:text-xl">
                What I&apos;ve built and still use: my favourite builds and Chrome extensions.
              </p>
              {/* Checked points, in the style of the Lab rows' ads. */}
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                {['Public on GitHub', 'MIT-licensed', 'Star, fork or open an issue'].map((point) => (
                  <li key={point} className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                    <FiCheck className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <nav aria-label="Lab sections" className="mt-7 flex flex-wrap justify-center gap-2">
                {/* Each pill leads with its part's icon, the same as the rail's
                     (components/sections/LabSectionNav.tsx; round 5 of 2026-11-02). */}
                {[
                  ...(buildLog ? [{ label: 'Build log', href: '#build-log', Icon: LuScrollText, size: 'size-3.5' }] : []),
                  { label: 'Featured', href: '#featured', Icon: LuStar, size: 'size-3.5' },
                  { label: 'Chrome Extensions', href: '#extensions', Icon: SiGooglechrome, size: 'size-3' },
                  { label: "What's cookin'", href: '#upcoming', Icon: LuCookingPot, size: 'size-3.5' },
                ].map(({ label, href, Icon, size }) => (
                  <a
                    key={href}
                    href={href}
                    className="group flex items-center gap-2 rounded-full border border-white/12 bg-white/4 py-1.5 pr-3.5 pl-3 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:text-cyan-200"
                  >
                    <Icon className={`${size} shrink-0 text-cyan-300/80 transition-colors group-hover:text-cyan-200`} aria-hidden="true" />
                    {label}
                  </a>
                ))}
              </nav>
            </Reveal>
          </div>

          {/* The Lab's first part: what shipped lately (the owner's ask, 2026-11-02). */}
          <SectionErrorBoundary sectionName="Build Log">
            <BuildLogStrip />
          </SectionErrorBoundary>

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

        {/* Bridge: the portfolio (hire me) + Tech for Pros (my company) */}
        <Band>
          <SectionErrorBoundary sectionName="Work With Me">
            <WorkWithMe />
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
