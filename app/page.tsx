'use client'
import React from 'react'
import Hero from '@/components/sections/Hero'
import Grid from '@/components/sections/Grid'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { navItems } from '@/data/navigation'
import { useSectionTracking } from '@/hooks/useSectionTracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'
import SectionErrorBoundary from '@/components/SectionErrorBoundary'
import dynamic from 'next/dynamic'

const Projects = dynamic(() => import('@/components/Projects'))
const ProjectsMarquee = dynamic(() => import('@/components/sections/ProjectsMarquee'))
const Footer = dynamic(() => import('@/components/layout/Footer'))
const ScrollToTop = dynamic(() => import('@/components/ui/ScrollToTop'), { ssr: false })

export default function Home() {
  useSectionTracking()
  useScrollTracking()

  return (
    <main id="main-content" className="relative w-full bg-blue-400 dark:bg-darkBlue flex overflow-hidden">
      <div className="w-full m-auto">
        <SectionErrorBoundary sectionName="Hero Section">
          <Hero />
        </SectionErrorBoundary>

        <FloatingNav navItems={navItems} />

        <div className="m-auto max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <section id="about" aria-label="Tech stack">
            <SectionErrorBoundary sectionName="About Section">
              <Grid />
            </SectionErrorBoundary>
          </section>

          <section id="builds" aria-label="Featured builds">
            <SectionErrorBoundary sectionName="Projects Section">
              <Projects />
            </SectionErrorBoundary>
          </section>
        </div>

        {/* Full-width projects marquee */}
        <SectionErrorBoundary sectionName="Projects Marquee">
          <ProjectsMarquee />
        </SectionErrorBoundary>

        <div className="m-auto max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <section id="contact">
            <SectionErrorBoundary sectionName="Contact Section">
              <Footer />
            </SectionErrorBoundary>
          </section>
        </div>

        <ScrollToTop />
      </div>
    </main>
  )
}
