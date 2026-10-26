import React from 'react'
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

        {/* ===== THE LAB: one section. Featured builds, then the Chrome
             extensions (and a Tools grid, only if a build ever lands there).
             The navbar "Lab" menu scrolls to #lab, #featured and #extensions. ===== */}
        <Band id="lab" reveal={false}>
          <Reveal className="pt-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">The Lab</h2>
            <p className="mt-2 max-w-[560px] text-[#9cadc5]">
              Everything I&apos;ve built and still use: the tools I run every day, the builds I&apos;m proudest of, and
              Chrome extensions.
            </p>
            <p className="mt-2 max-w-[560px] text-sm text-slate-450">
              All of it is public on GitHub, and most of it is MIT-licensed open source: star it, fork it, or open an
              issue.
            </p>
            <nav aria-label="Lab sections" className="mt-5 flex flex-wrap gap-2">
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

          <SectionErrorBoundary sectionName="Featured Projects">
            <FeaturedProjects />
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Extensions">
            <Reveal>
              <ExtensionsShowcase />
            </Reveal>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Tools">
            <Reveal>
              <ShelfSection shelf="tool" />
            </Reveal>
          </SectionErrorBoundary>
        </Band>

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
