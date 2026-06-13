'use client'
import React, { useId } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiGithub } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { FaXTwitter } from 'react-icons/fa6'
import { MdRadioButtonChecked } from 'react-icons/md'
import { coloredSquares } from '@/data/grid'
import ScrollButton from '@/components/ui/BentoComponents/ScrollButton'

const CELL = 52

const AnimatedGrid = () => {
  const id = useId()
  const gradId = useId()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full opacity-100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={id} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path
              d={`M.5 ${CELL}V.5H${CELL}`}
              fill="none"
              stroke="rgba(255,255,255,0.055)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id={gradId} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="transparent" stopOpacity={0} />
            <stop offset="100%" stopColor="#050812" stopOpacity={1} />
          </radialGradient>

          <style>{`
            @keyframes n8pulse1 {
              0%, 100% { fill: #0c1836; opacity: 0.7; }
              50%       { fill: #162957; opacity: 1; }
            }
            @keyframes n8pulse2 {
              0%, 100% { fill: #141e38; opacity: 0.6; }
              50%       { fill: #0d2060; opacity: 0.9; }
            }
            @keyframes n8pulse3 {
              0%, 100% { fill: #14275e; opacity: 0.5; }
              50%       { fill: #1a3070; opacity: 0.85; }
            }
            .n8sq1 { animation: n8pulse1 3.2s ease-in-out infinite; }
            .n8sq2 { animation: n8pulse2 3.8s ease-in-out infinite 0.6s; }
            .n8sq3 { animation: n8pulse3 4.1s ease-in-out infinite 1.2s; }
          `}</style>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${id})`} />

        {coloredSquares.map(([x, y], i) => (
          <rect
            key={`${x}-${y}-${i}`}
            className={`n8sq${(i % 3) + 1}`}
            x={x * CELL + 1}
            y={y * CELL + 1}
            width={CELL - 1}
            height={CELL - 1}
          />
        ))}

        {/* Vignette */}
        <rect width="100%" height="100%" fill={`url(#${gradId})`} />
      </svg>

      {/* Extra radial fade at top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,transparent_30%,#050812_80%)]" />
    </div>
  )
}

const Hero = () => {
  return (
    <div
      className="relative flex flex-col min-h-[90vh] items-center justify-center bg-[#050812] overflow-hidden select-none"
      id="home"
    >
      <AnimatedGrid />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full flex flex-col items-center justify-center pt-28 pb-16">

        {/* Live pill */}
        <motion.a
          href="https://github.com/n8watkins"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/12 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-200 text-sm font-medium text-slate-300 cursor-pointer group"
        >
          <span className="flex items-center gap-1.5 text-green-400">
            <MdRadioButtonChecked className="w-3 h-3 animate-pulse" />
            <span className="text-[0.72rem] font-bold tracking-widest uppercase">Live on GitHub</span>
          </span>
          <span className="text-white/20">·</span>
          <span className="text-slate-400 text-[0.82rem]">Currently Building: <span className="text-cyan-400 font-semibold">Asset Arsenal</span></span>
          <span className="text-slate-600 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
        </motion.a>

        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-10 md:gap-8">
          {/* Text */}
          <div className="flex-1 flex flex-col items-start gap-5 min-w-0">

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[2.8rem] sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-extrabold leading-[1.04] tracking-tight text-slate-50"
            >
              Building software{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text text-transparent">
                in public.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[#9cadc5] text-base md:text-lg leading-relaxed max-w-[480px]"
            >
              I build apps, AI tools, agents, and creator systems live and in public —
              agent-assisted builds, prompt-native workflows, local inference experiments.
              Follow the journey, watch the process, and ship with me.
            </motion.p>

            {/* Build philosophy — subtle side note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center gap-3 font-mono text-[0.75rem] text-slate-600 select-none"
            >
              {['idea', 'prompt', 'build', 'stream', 'ship', 'repeat'].map((w, i, arr) => (
                <React.Fragment key={w}>
                  <span className="text-slate-500">{w}</span>
                  {i < arr.length - 1 && <span className="text-white/15">→</span>}
                </React.Fragment>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-3 flex-wrap"
            >
              <a
                href="https://twitch.tv/n8watkins"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-900/40"
              >
                <MdRadioButtonChecked className="w-4 h-4" />
                Watch Live
              </a>
              <ScrollButton
                link="projects"
                text="Explore Builds"
                className="px-5 py-2.5 rounded-xl border border-white/12 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
              />
            </motion.div>

            {/* Socials */}
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.72 }}
              aria-label="Social links"
              className="flex items-center gap-0.5 -ml-2"
            >
              {[
                { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="w-4.5 h-4.5" /> },
                { href: 'https://linkedin.com/in/n8watkins', label: 'LinkedIn', icon: <CiLinkedin className="w-5 h-5" /> },
                { href: 'https://x.com/n8watkins', label: 'X', icon: <FaXTwitter className="w-4 h-4" /> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all duration-150">
                  {s.icon}
                </a>
              ))}
            </motion.nav>
          </div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-[14rem] h-[14rem] sm:w-[17rem] sm:h-[17rem] md:w-[19rem] md:h-[19rem] relative flex-shrink-0"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-xl scale-110" />
            <div className="relative w-full h-full">
              <div className="absolute inset-0 dark:bg-black/10 rounded-full z-10" />
              <Image
                src="/hero/portrait.jpg"
                className="rounded-full object-cover ring-1 ring-white/10"
                fill
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                sizes="(max-width: 640px) 14rem, (max-width: 768px) 17rem, 19rem"
                alt="Nathan Watkins — builder based in Los Angeles"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Hero
