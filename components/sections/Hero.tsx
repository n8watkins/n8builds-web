'use client'
import React, { useId } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiGithub } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { FaXTwitter } from 'react-icons/fa6'
import { MdRadioButtonChecked } from 'react-icons/md'
import { coloredSquares } from '@/data/grid'
import WhoamiTerminal from '@/components/features/WhoamiTerminal'
import { nowItems } from '@/data/now'

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
          <span className="text-slate-400 text-[0.82rem]">Currently Building: <span className="text-cyan-400 font-semibold">{nowItems[0]?.project}</span></span>
          <span className="text-slate-600 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
        </motion.a>

        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-10 md:gap-8">
          {/* Text */}
          <div className="flex-1 flex flex-col items-start gap-5 min-w-0">

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="font-mono text-[0.78rem] tracking-wide text-slate-500 lowercase"
            >
              building software in public
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[2.8rem] sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-extrabold leading-[1.04] tracking-tight text-slate-50 lowercase"
            >
              n8builds{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text text-transparent">
                in public
              </span>
            </motion.h1>

            {/* whoami terminal = the description (blended copy) */}
            <WhoamiTerminal className="w-full max-w-[520px]" />

            {/* Build philosophy — electrified circuit (a glowing comet traces each chip's
                outline in sequence, then hands off through the arrow to the next chip) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center gap-1.5 font-mono text-[0.7rem] select-none flex-wrap"
            >
              <style>{`
                @property --n8ang {
                  syntax: '<angle>';
                  initial-value: 0deg;
                  inherits: false;
                }

                /* Each chip owns one 2s slot of a shared 12s loop. Within its
                   slot the comet sweeps the full perimeter (--n8ang 0deg -> 360deg)
                   and is then HIDDEN; staggering each chip's POSITIVE animation-delay
                   by one slot hands the lit outline off box -> box, left -> right,
                   and the previous box goes dark the instant the comet leaves it. */
                @keyframes n8cometSweep {
                  0%          { --n8ang: 0deg;   opacity: 1; }
                  16.666%     { --n8ang: 360deg; opacity: 1; }
                  16.8%, 100% { --n8ang: 360deg; opacity: 0; }
                }
                @keyframes n8chipGlow {
                  0%        { border-color: rgba(34,211,238,0.55); background-color: rgba(34,211,238,0.06); color: rgb(165,243,252); text-shadow: 0 0 8px rgba(34,211,238,0.6); }
                  16.666%   { border-color: rgba(34,211,238,0.55); background-color: rgba(34,211,238,0.06); color: rgb(165,243,252); text-shadow: 0 0 8px rgba(34,211,238,0.6); }
                  21%, 100% { border-color: rgba(34,211,238,0.12); background-color: rgba(34,211,238,0); color: rgb(100,116,139); text-shadow: none; }
                }
                @keyframes n8arrowGlow {
                  0%        { color: rgba(255,255,255,0.12); text-shadow: none; }
                  4%, 9%    { color: rgb(34,211,238); text-shadow: 0 0 8px rgba(34,211,238,0.85); }
                  14%, 100% { color: rgba(255,255,255,0.12); text-shadow: none; }
                }

                .n8-cnode {
                  position: relative;
                  isolation: isolate;
                  border-color: rgba(34,211,238,0.12);
                  color: rgb(100,116,139);
                  /* --n8delay is set per-chip inline; the chip glow and the
                     ::before comet sweep share it so they stay in lockstep. */
                  animation: n8chipGlow 12s linear infinite;
                  animation-delay: var(--n8delay, 0s);
                }
                .n8-cnode::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  padding: 1px;
                  opacity: 0;
                  /* comet starts & ends at the 3 o'clock edge (where the arrow is):
                     the bright head sits at 25% of the cone (right side) and sweeps
                     one full turn clockwise back to it. */
                  background: conic-gradient(
                    from var(--n8ang),
                    transparent 0 10%,
                    rgba(103,232,249,0.5) 18%,
                    #67e8f9 23%,
                    #22d3ee 25%,
                    transparent 28%
                  );
                  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor;
                          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                          mask-composite: exclude;
                  filter: drop-shadow(0 0 4px rgba(34,211,238,0.7));
                  animation: n8cometSweep 12s linear infinite;
                  animation-delay: var(--n8delay, 0s);
                  z-index: 1;
                  pointer-events: none;
                }
                .n8-carrow {
                  animation: n8arrowGlow 12s linear infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                  .n8-cnode, .n8-cnode::before, .n8-carrow { animation: none; }
                  .n8-cnode::before { opacity: 0; }
                  .n8-cnode { border-color: rgba(34,211,238,0.3); }
                }
              `}</style>
              {['idea', 'prompt', 'build', 'stream', 'ship', 'repeat'].map((w, i, arr) => (
                <React.Fragment key={w}>
                  <span
                    className="n8-cnode rounded-md border px-2 py-1 lowercase tracking-wide"
                    style={{ ['--n8delay' as string]: `${i * 2}s` }}
                  >
                    {w}
                  </span>
                  {i < arr.length - 1 && (
                    // arrow lights at the hand-off as the comet leaves chip i
                    <span className="n8-carrow" style={{ animationDelay: `${i * 2 + 1.5}s` }}>→</span>
                  )}
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
                href="#now"
                className="relative inline-flex h-10 overflow-hidden rounded-xl p-[1px] transition-all duration-200 hover:scale-[1.02]"
              >
                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#2563eb_50%,#22d3ee_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-slate-100 backdrop-blur-3xl">
                  See what I&apos;m building
                </span>
              </a>
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
                { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="w-[1.35rem] h-[1.35rem]" /> },
                { href: 'https://linkedin.com/in/n8watkins', label: 'LinkedIn', icon: <CiLinkedin className="w-7 h-7" /> },
                { href: 'https://x.com/n8watkins', label: 'X', icon: <FaXTwitter className="w-[1.2rem] h-[1.2rem]" /> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all duration-150">
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
