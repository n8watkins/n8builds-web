'use client'
import React from 'react'
import Hero from '@/components/sections/Hero'
import Navbar from '@/components/layout/Navbar'
import { useSectionTracking } from '@/hooks/useSectionTracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import dynamic from 'next/dynamic'

const FeaturedProjects = dynamic(() => import('@/components/sections/FeaturedProjects'))
const ProjectsMarquee = dynamic(() => import('@/components/sections/ProjectsMarquee'))
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
        <SectionErrorBoundary sectionName="Projects Section">
          <FeaturedProjects />
        </SectionErrorBoundary>
      </div>

      {/* Full-width builds marquee */}
      <SectionErrorBoundary sectionName="Projects Marquee">
        <ProjectsMarquee />
      </SectionErrorBoundary>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
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
