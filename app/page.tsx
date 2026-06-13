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
const LoadoutTeaser = dynamic(() => import('@/components/sections/LoadoutTeaser'))
const Footer = dynamic(() => import('@/components/layout/Footer'))
const ScrollToTop = dynamic(() => import('@/components/ui/ScrollToTop'), { ssr: false })

export default function Home() {
  useSectionTracking()
  useScrollTracking()

  return (
    <main id="main-content" className="relative w-full bg-[#050812] min-h-screen">
      <Navbar />

      <SectionErrorBoundary sectionName="Hero Section">
        <Hero />
      </SectionErrorBoundary>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* The in-public hook — what I'm building right now */}
        <SectionErrorBoundary sectionName="Currently Building">
          <NowBuilding />
        </SectionErrorBoundary>

        {/* Featured showcase — alternating image rows */}
        <SectionErrorBoundary sectionName="Featured Projects">
          <FeaturedProjects />
        </SectionErrorBoundary>

        {/* Shelf content lives on the page, each linking to its full shelf */}
        <SectionErrorBoundary sectionName="Projects">
          <ShelfSection shelf="project" />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Extensions">
          <ShelfSection shelf="extension" />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Tools">
          <ShelfSection shelf="tool" />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Lab">
          <ShelfSection shelf="lab" />
        </SectionErrorBoundary>

        {/* Tech loadout teaser → /loadout */}
        <SectionErrorBoundary sectionName="Loadout Teaser">
          <LoadoutTeaser />
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
