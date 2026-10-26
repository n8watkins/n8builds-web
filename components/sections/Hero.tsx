import React from 'react'
import Image from 'next/image'
import { FiArrowDown, FiGithub } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { FaXTwitter } from 'react-icons/fa6'
import WhoamiTerminal from '@/components/features/WhoamiTerminal'
import FadeIn from '@/components/ui/FadeIn'
import HeroGrid from '@/components/sections/HeroGrid'
import HeroChainMeter from '@/components/sections/HeroChainMeter'

/**
 * The hero, rendered on the server. Its entrances are CSS (FadeIn) from the
 * first paint, so nothing above the fold waits for hydration; only the grid
 * and the chain's wire meter run script (HeroGrid, HeroChainMeter).
 */
const Hero = () => {
  return (
    <div
      className="relative flex flex-col min-h-[min(90vh,800px)] md:portrait:min-h-[min(90vh,720px)] items-center bg-linear-to-b from-darkBlue from-70% to-transparent overflow-hidden select-none"
      id="home"
    >
      <HeroGrid />

      {/* Top-aligned, not centered: a slow device paints the hero while it is
          still streaming in, and re-centering a growing column shifted it up. */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full flex flex-col items-center pt-28 lg:pt-40 pb-16">


        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-10 md:gap-8">
          {/* Text */}
          <div className="flex-1 flex flex-col items-start gap-5 min-w-0 w-full md:w-auto">

            <div>
              <FadeIn
                as="h1"
                delay={0.08}
                className="text-[3.2rem] sm:text-6xl/none lg:text-7xl/none xl:text-[5rem] font-extrabold leading-none tracking-tight text-slate-50"
              >
                n8builds
              </FadeIn>
              <FadeIn
                as="p"
                delay={0.16}
                className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text text-transparent"
              >
                Spending tokens, shipping features.
              </FadeIn>
            </div>

            {/* whoami terminal = the description (blended copy) */}
            <WhoamiTerminal className="w-full max-w-[520px]" />

            {/* Build philosophy - electrified circuit: a comet traces each chip's
                outline left -> right, then runs the loop-back line from repeat under the
                whole chain back into prompt, and the loop starts again. */}
            <FadeIn
              effect="in"
              delay={0.45}
              className="relative w-fit font-mono text-[0.6rem] min-[360px]:text-[0.72rem] sm:text-[0.85rem] select-none [--n8wire:280px] sm:[--n8wire:335px]"
            >
              {/* The chain's styles live in app/globals.css (.n8-cnode and friends). */}
              <HeroChainMeter />
              <div className="flex items-center gap-1 min-[360px]:gap-1.5">
                {['prompt', 'build', 'ship', 'repeat'].map((w, i, arr) => (
                  <React.Fragment key={w}>
                    <span
                      className={`n8-cnode rounded-md border px-1.5 min-[360px]:px-2 py-1 sm:px-3 sm:py-1.5 lowercase tracking-wide${
                        i > 0 && i < arr.length - 1 ? ' n8-split' : ''
                      }`}
                      style={{
                        // 9.2s loop, 1.8s chip spacing, phase-shifted -8.2s so the page loads
                        // pulse-mid-wire; the first chip (prompt) fires ~0.45s early so it
                        // lights as the wire lands.
                        ['--n8delay' as string]: `${(i === 0 ? -0.45 : i * 1.8) - 8.2}s`,
                        // prompt starts bottom-left (~7:30), where the wire lands, and repeat
                        // at 9 o'clock; the split chips ignore --n8start (they sweep from
                        // 270deg +/- the angle).
                        ['--n8start' as string]:
                          i === 0 ? '135deg' : i === arr.length - 1 ? '172deg' : '0deg',
                      }}
                    >
                      {w}
                    </span>
                    {/* middle chips (build/ship) carry a second light via
                        ::after, so the two halves meet at the 3 o'clock arrow */}
                    {i < arr.length - 1 && (
                      // arrow lights at the hand-off as the comet leaves chip i
                      <span className="n8-carrow" style={{ animationDelay: `${(i === 0 ? 0.43 : i * 1.8 + 0.88) - 8.2}s` }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {/* loop-back circuit line: repeat (right) -> down -> under the chain ->
                  up into prompt (left). preserveAspectRatio=none stretches it to the
                  chain width; non-scaling-stroke keeps the line crisp. */}
              <svg className="n8-loop" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">
                <path
                  className="n8-loop-base"
                  d="M98,0 L98,9 Q98,14 93,14 L7,14 Q2,14 2,9 L2,0"
                  fill="none"
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className="n8-loop-comet"
                  d="M98,0 L98,9 Q98,14 93,14 L7,14 Q2,14 2,9 L2,0"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray="16 999"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </FadeIn>

            {/* CTAs */}
            <FadeIn delay={0.55} className="flex items-center gap-3 flex-wrap">
              <a
                href="#now"
                className="group relative inline-flex h-12 overflow-hidden rounded-xl p-px transition-all duration-200 hover:scale-[1.02]"
              >
                <span className="hero-cta-spin absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#2563eb_50%,#22d3ee_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-base font-bold text-slate-100 backdrop-blur-3xl">
                  See what I&apos;m building
                  <FiArrowDown aria-hidden className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                </span>
              </a>
            </FadeIn>

            {/* Socials */}
            <FadeIn effect="in" delay={0.72} as="nav" aria-label="Social links" className="flex items-center gap-0.5 -ml-2">
              {[
                { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="w-[1.6rem] h-[1.6rem]" /> },
                { href: 'https://linkedin.com/in/n8watkins', label: 'LinkedIn', icon: <CiLinkedin className="w-8 h-8" /> },
                { href: 'https://x.com/n8watkins', label: 'X', icon: <FaXTwitter className="w-[1.4rem] h-[1.4rem]" /> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-12 h-12 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all duration-150">
                  {s.icon}
                </a>
              ))}
            </FadeIn>

            {/* The direct route for someone hiring: the developer portfolio. */}
            <FadeIn as="p" effect="in" delay={0.8} className="text-sm text-slate-400">
              Hiring?{' '}
              <a
                href="https://portfolio.n8builds.dev"
                className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200"
              >
                See my developer portfolio
              </a>
            </FadeIn>
          </div>

          {/* Portrait */}
          {/* Fades and scales in with the rest of the hero, but in plain CSS
              (hero-portrait-in, app/globals.css), not motion: the portrait is
              the page's LCP element, so its entrance starts on first paint
              from the server HTML instead of waiting for hydration. Reduced
              motion skips it, and the portrait shows at once. */}
          <div className="hero-portrait-in w-64 h-64 sm:w-76 sm:h-76 md:w-84 md:h-84 lg:w-96 lg:h-96 relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-cyan-500/20 to-blue-600/20 blur-xl scale-110" />
            <div className="relative w-full h-full">
              <div className="absolute inset-0 dark:bg-black/10 rounded-full z-10" />
              <Image
                src="/hero/portrait.jpg"
                className="rounded-full object-cover ring-1 ring-white/10"
                fill
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                sizes="(max-width: 640px) 16rem, (max-width: 768px) 19rem, (max-width: 1024px) 21rem, 24rem"
                alt="Nathan Watkins - builder based in Los Angeles"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
