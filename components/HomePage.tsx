import React from 'react'
import { FiCheck } from 'react-icons/fi'
import { LuFlaskConical } from 'react-icons/lu'
import Hero from '@/components/sections/Hero'
import Navbar from '@/components/layout/Navbar'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import Reveal from '@/components/ui/Reveal'
import ScrollToTop from '@/components/ui/ScrollToTop'
import HomeEffects from '@/components/HomeEffects'
import NowBuilding from '@/components/sections/NowBuilding'
import FeaturedProjects from '@/components/sections/FeaturedProjects'
import ShelfSection from '@/components/sections/ShelfSection'
import UseAsTemplate from '@/components/sections/UseAsTemplate'
import PortfolioAd from '@/components/sections/PortfolioAd'
import NotionsStrip from '@/components/sections/NotionsStrip'
import ExtensionsShowcase from '@/components/sections/ExtensionsShowcase'
import LabSectionNav from '@/components/sections/LabSectionNav'
import HomeStack from '@/components/sections/HomeStack'
import WorkWithMe from '@/components/sections/WorkWithMe'
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
  children,
}: {
  id?: string
  tone?: 'base' | 'raised'
  fadeIn?: boolean
  reveal?: boolean
  as?: 'div' | 'section'
  children: React.ReactNode
}) {
  const background = fadeIn
    ? 'bg-linear-to-b from-transparent to-white/[0.022] to-[260px]'
    : tone === 'raised'
      ? 'border-t border-white/[0.06] bg-white/[0.022]'
      : 'border-t border-white/[0.06]'
  return (
    <Tag id={id} className={`relative z-10 ${background}`}>
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
export default function HomePage({ posts }: { posts: Post[] }) {
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
             (app/globals.css, "The Lab's colour washes"): My tools and Featured
             (FeaturedProjects), the Chrome extensions, then a Tools grid (only
             if a build ever lands there). The parts are full-bleed, so the
             Lab sets its own content width instead of using a Band. The navbar
             "Lab" menu and the side nav scroll to #lab and the part ids. ===== */}
        {/* Jumping to #lab (the navbar's Lab menu) lands its top edge right under the
             69px navbar, not 11px lower (html scroll-padding-top is 80px), so no strip
             of the band above shows between the two. */}
        <div id="lab" className="relative z-10 scroll-mt-[-11px] border-t border-white/[0.06]">
          {/* Preview only (2026-10-26): ?labBg=b shows the per-part washes instead of per-project. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `if(/[?&]labBg=b\\b/.test(location.search))document.documentElement.dataset.labBg='b'`,
            }}
          />
          {/* Desktop only: a sticky rail in the left gutter marking the Lab part on screen. */}
          <LabSectionNav />
          {/* The intro picks up the raised tone the band above ends on and eases it out,
               so the top of the Lab has no lighter strip under the navbar; a faint cyan
               glow sits behind the heading. Centred across the full content width. */}
          <div className="bg-[radial-gradient(50%_320px_at_50%_0,rgb(34_211_238/0.08),transparent_100%),linear-gradient(to_bottom,rgb(255_255_255/0.022),transparent_220px)]">
            <Reveal className="mx-auto flex max-w-6xl flex-col items-center px-5 pt-16 pb-6 text-center sm:px-8 sm:pt-20">
              {/* The Lab's mark (the owner's pick, 2026-10-26): a flask in a chip like the rows' app icons. */}
              <div className="flex items-center gap-4 sm:gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/30 sm:h-16 sm:w-16">
                  <LuFlaskConical className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
                </span>
                <h2 className="text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">The Lab</h2>
              </div>
              {/* One line from laptop width up; wraps naturally on phones. */}
              <p className="mt-5 text-balance text-lg text-[#9cadc5] sm:text-xl">
                Everything I&apos;ve built and still use: daily tools, favourite builds, Chrome extensions.
              </p>
              {/* Checked points, in the style of the Lab rows' ads. */}
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                {['Public on GitHub', 'Mostly MIT-licensed', 'Star, fork or open an issue'].map((point) => (
                  <li key={point} className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                    <FiCheck className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <nav aria-label="Lab sections" className="mt-7 flex flex-wrap justify-center gap-2">
                {[
                  { label: 'My tools', href: '#my-tools' },
                  { label: 'Featured', href: '#featured' },
                  { label: 'Chrome extensions', href: '#extensions' },
                ].map((c) => (
                  <a
                    key={c.href}
                    href={c.href}
                    className="rounded-full border border-white/12 bg-white/4 px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:text-cyan-200"
                  >
                    {c.label}
                  </a>
                ))}
              </nav>
            </Reveal>
          </div>

          <SectionErrorBoundary sectionName="Featured Projects">
            <FeaturedProjects />
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Extensions">
            <Reveal>
              <ExtensionsShowcase />
            </Reveal>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Tools">
            <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
              <ShelfSection shelf="tool" />
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

        {/* Homepage stack: AI marquee + Turso TL;DR -> /loadout */}
        <Band>
          <SectionErrorBoundary sectionName="My Stack">
            <HomeStack />
          </SectionErrorBoundary>
        </Band>

        {/* Bridge: the portfolio (hire me) + Appturnity (client work) */}
        <Band tone="raised">
          <SectionErrorBoundary sectionName="Work With Me">
            <WorkWithMe />
          </SectionErrorBoundary>
        </Band>

        {/* The contact form animates its own fields in. */}
        {/* ===== USE THIS AS A TEMPLATE: both sites are public; how n8builds
             is built and tested lives here, not in a featured row. ===== */}
        <Band>
          <SectionErrorBoundary sectionName="Use as Template">
            <UseAsTemplate />
          </SectionErrorBoundary>
        </Band>

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
