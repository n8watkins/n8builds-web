import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import GridBackground from '@/components/ui/GridBackground'
import { FiGithub } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { FaXTwitter } from 'react-icons/fa6'
import { MdRadioButtonChecked } from 'react-icons/md'
import ScrollButton from '@/components/ui/BentoComponents/ScrollButton'

const Hero = () => {
  return (
    <div
      className="relative flex flex-col min-h-[85vh] items-center justify-center bg-blue-400 dark:bg-darkBlue transition-bg select-none"
      id="home">
      <GridBackground />

      <div className="max-w-[100vw] md:max-w-2xl lg:max-w-[70vw] flex flex-col items-center justify-center z-50 pt-32 pb-12 md:pt-20 md:pb-10">

        {/* Live pill */}
        <motion.a
          href="https://github.com/n8watkins"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200 text-sm font-semibold text-slate-200 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-green-400">
            <MdRadioButtonChecked className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase">Live on GitHub</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">Currently Building: <span className="text-cyan-400">Asset Arsenal</span></span>
          <span className="text-slate-500 text-xs">→</span>
        </motion.a>

        <div className="flex flex-col-reverse md:flex-row items-center justify-center w-full gap-6 md:gap-8">
          {/* Text side */}
          <div className="flex max-w-[100vw] md:max-w-2xl lg:max-w-[60vw] flex-col items-start gap-4">

            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center md:text-start w-full text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
              Building software{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                in public.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center md:text-start text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed max-w-lg">
              I build apps, tools, experiments, and creator systems live and in public.
              Follow the journey, watch the process, and ship with me.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center justify-center md:justify-start gap-3 w-full flex-wrap">
              <a
                href="https://github.com/n8watkins"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-purple-900/40"
              >
                <MdRadioButtonChecked className="w-4 h-4" />
                Watch Live
              </a>
              <ScrollButton link="builds" text="Explore Builds" className="px-5 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm transition-all duration-200 hover:scale-[1.02]" />
            </motion.div>

            {/* Social links */}
            <motion.nav
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.85, ease: [0.25, 0.1, 0.25, 1] }}
              aria-label="Social media links"
              className="flex items-center justify-center md:justify-start gap-1"
            >
              <a href="https://github.com/n8watkins" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
                <FiGithub className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />
              </a>
              <a href="https://www.linkedin.com/in/n8watkins/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
                <CiLinkedin className="w-6 h-6 text-slate-400 hover:text-slate-200 transition-colors" />
              </a>
              <a href="https://x.com/n8watkins" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
                <FaXTwitter className="w-4.5 h-4.5 text-slate-400 hover:text-slate-200 transition-colors" />
              </a>
            </motion.nav>
          </div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-[13rem] h-[13rem] sm:w-[16rem] sm:h-[16rem] md:w-[18rem] md:h-[18rem] relative flex-shrink-0">
            <div className="absolute inset-0 dark:bg-black/20 rounded-full z-10" />
            <Image
              src="/hero/portrait.jpg"
              className="rounded-full object-cover"
              fill
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              sizes="(max-width: 640px) 13rem, (max-width: 768px) 16rem, 18rem"
              alt="Nathan Watkins — builder and developer based in Los Angeles"
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Hero
