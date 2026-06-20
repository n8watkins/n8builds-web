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
const ExtensionsShowcase = dynamic(() => import('@/components/sections/ExtensionsShowcase'))
const ToolsSection = dynamic(() => import('@/components/sections/ToolsSection'))
const HomeStack = dynamic(() => import('@/components/sections/HomeStack'))
const Footer = dynamic(() => import('@/components/layout/Footer'))
const ScrollToTop = dynamic(() => import('@/components/ui/ScrollToTop'), { ssr: false })

export default function Home() {
  useSectionTracking()
  useScrollTracking()

  return (
    <main id="main-content" className="relative w-full min-h-screen bg-gradient-to-b from-[#050812] via-[#06101f] to-[#050812]">
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

        {/* The Lab — everything I'm building (merged projects + lab) */}
        <SectionErrorBoundary sectionName="The Lab">
          <ShelfSection shelf="lab" />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Extensions">
          <ExtensionsShowcase />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Tools">
          <ToolsSection />
        </SectionErrorBoundary>

        {/* Homepage stack — AI marquee + Turso TL;DR → /loadout */}
        <SectionErrorBoundary sectionName="My Stack">
          <HomeStack />
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
