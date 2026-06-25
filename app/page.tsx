'use client'
import React from 'react'
import Hero from '@/components/sections/Hero'
import Navbar from '@/components/layout/Navbar'
import { useSectionTracking } from '@/hooks/useSectionTracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import dynamic from 'next/dynamic'

const NowBuilding = dynamic(() => import('@/components/sections/NowBuilding'))
const FeaturedProjects = dynamic(() => import('@/components/sections/FeaturedProjects'))
const ShelfSection = dynamic(() => import('@/components/sections/ShelfSection'))
const NotionsStrip = dynamic(() => import('@/components/sections/NotionsStrip'))
const ExtensionsShowcase = dynamic(() => import('@/components/sections/ExtensionsShowcase'))
const HomeStack = dynamic(() => import('@/components/sections/HomeStack'))
const WorkWithMe = dynamic(() => import('@/components/sections/WorkWithMe'))
const Footer = dynamic(() => import('@/components/layout/Footer'))
const ScrollToTop = dynamic(() => import('@/components/ui/ScrollToTop'), { ssr: false })

export default function Home() {
  useSectionTracking()
  useScrollTracking()

  return (
    <main
      id="main-content"
      className="relative w-full min-h-screen bg-gradient-to-b from-[#050812] via-[#06101f] to-[#050812]"
    >
      <Navbar />

      {/* Ambient color shift — soft glows so the page isn't one flat color */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[6%] h-[40rem] w-[40rem] rounded-full bg-cyan-500/[0.10] blur-[150px]" />
        <div className="absolute -right-[12%] top-[26%] h-[38rem] w-[38rem] rounded-full bg-blue-600/[0.11] blur-[150px]" />
        <div className="absolute left-[12%] top-[46%] h-[34rem] w-[34rem] rounded-full bg-teal-500/[0.09] blur-[150px]" />
        <div className="absolute -right-[8%] top-[66%] h-[34rem] w-[34rem] rounded-full bg-indigo-600/[0.09] blur-[150px]" />
        <div className="absolute left-[8%] top-[86%] h-[34rem] w-[34rem] rounded-full bg-emerald-500/[0.07] blur-[150px]" />
      </div>

      <SectionErrorBoundary sectionName="Hero Section">
        <Hero />
      </SectionErrorBoundary>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        {/* The in-public hook — what I'm building right now */}
        <SectionErrorBoundary sectionName="Currently Building">
          <NowBuilding />
        </SectionErrorBoundary>

        {/* Featured showcase — alternating image rows */}
        <SectionErrorBoundary sectionName="Featured Projects">
          <FeaturedProjects />
        </SectionErrorBoundary>

        {/* ===== THE LAB — one big section: web apps, extensions, tools, resources.
             The navbar "Lab" dropdown scrolls to these anchors (#lab/#extensions/
             #tools/#resources). No separate shelf pages. ===== */}

        {/* Lab lead-in + in-page jump nav */}
        <div id="lab" className="pt-16">
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-teal-400">The bench</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">The Lab</h2>
          <p className="mt-2 max-w-[560px] text-[#9cadc5]">
            Everything I&apos;m building, in one place — web apps and experiments, Chrome extensions,
            dev tools, and free resources.
          </p>
          <nav aria-label="Lab sections" className="mt-5 flex flex-wrap gap-2">
            {[
              { label: 'Web apps', href: '#lab' },
              { label: 'Chrome Extensions', href: '#extensions' },
              { label: 'Tools', href: '#tools' },
              { label: 'Resources', href: '#resources' },
            ].map((c) => (
              <a
                key={c.href}
                href={c.href}
                className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:text-cyan-200"
              >
                {c.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Web apps & experiments (the lead-in div above owns the #lab anchor) */}
        <SectionErrorBoundary sectionName="The Lab">
          <ShelfSection shelf="lab" anchorId={null} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Extensions">
          <ExtensionsShowcase />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Tools">
          <ShelfSection shelf="tool" />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Resources">
          <ShelfSection shelf="resource" />
        </SectionErrorBoundary>
        {/* ===== end THE LAB ===== */}

        {/* N8 Notions — latest blog posts */}
        <SectionErrorBoundary sectionName="N8 Notions">
          <NotionsStrip />
        </SectionErrorBoundary>

        {/* Homepage stack — AI marquee + Turso TL;DR → /loadout */}
        <SectionErrorBoundary sectionName="My Stack">
          <HomeStack />
        </SectionErrorBoundary>

        {/* Bridge — feeds the portfolio (hire me) + Appturnity (client work) */}
        <SectionErrorBoundary sectionName="Work With Me">
          <WorkWithMe />
        </SectionErrorBoundary>

        <section id="contact">
          <SectionErrorBoundary sectionName="Contact Section">
            <Footer />
          </SectionErrorBoundary>
        </section>
      </div>

      <ScrollToTop />
    </main>
  )
}
