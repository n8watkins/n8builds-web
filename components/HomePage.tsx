'use client'
import React from 'react'
import Hero from '@/components/sections/Hero'
import Navbar from '@/components/layout/Navbar'
import { useSectionTracking } from '@/hooks/useSectionTracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import { useHydrated } from '@/hooks/useHydrated'
import Reveal from '@/components/ui/Reveal'

const NowBuilding = dynamic(() => import('@/components/sections/NowBuilding'))
const FeaturedProjects = dynamic(() => import('@/components/sections/FeaturedProjects'))
const ShelfSection = dynamic(() => import('@/components/sections/ShelfSection'))
const UseAsTemplate = dynamic(() => import('@/components/sections/UseAsTemplate'))
const PortfolioAd = dynamic(() => import('@/components/sections/PortfolioAd'))
const NotionsStrip = dynamic(() => import('@/components/sections/NotionsStrip'))
const ExtensionsShowcase = dynamic(() => import('@/components/sections/ExtensionsShowcase'))
const HomeStack = dynamic(() => import('@/components/sections/HomeStack'))
const WorkWithMe = dynamic(() => import('@/components/sections/WorkWithMe'))
const Footer = dynamic(() => import('@/components/layout/Footer'))
const ScrollToTop = dynamic(() => import('@/components/ui/ScrollToTop'), { ssr: false })

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

export default function HomePage() {
  useSectionTracking()
  useScrollTracking()
  const hydrated = useHydrated()

  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative w-full min-h-screen bg-linear-to-b from-darkBlue via-[#06101f] to-darkBlue focus:outline-none"
      >
        {/* Ambient color shift - soft glows so the page isn't one flat color.
            They sit at percentages of the page height, so they mount only after
            hydration: while a slow device is still painting the streamed page,
            the page grows and they would slide down (a layout shift). */}
        {hydrated && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <div className="absolute left-[-10%] top-[6%] h-160 w-160 rounded-full bg-cyan-500/10 blur-[150px]" />
            <div className="absolute right-[-12%] top-[26%] h-152 w-152 rounded-full bg-blue-600/11 blur-[150px]" />
            <div className="absolute left-[12%] top-[46%] h-136 w-136 rounded-full bg-teal-500/9 blur-[150px]" />
            <div className="absolute right-[-8%] top-[66%] h-136 w-136 rounded-full bg-indigo-600/9 blur-[150px]" />
            <div className="absolute left-[8%] top-[86%] h-136 w-136 rounded-full bg-emerald-500/[0.07] blur-[150px]" />
          </motion.div>
        )}

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
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-teal-400">The bench</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">The Lab</h2>
            <p className="mt-2 max-w-[560px] text-[#9cadc5]">
              Everything I&apos;ve built and still use: the apps I run every day, and Chrome extensions.
            </p>
            <nav aria-label="Lab sections" className="mt-5 flex flex-wrap gap-2">
              {[
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

        {/* N8 Notions: latest blog posts */}
        <Band tone="raised">
          <SectionErrorBoundary sectionName="N8 Notions">
            <NotionsStrip />
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
