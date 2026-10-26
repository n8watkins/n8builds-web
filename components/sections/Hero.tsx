import React from 'react'
import Image from 'next/image'
import { FiGithub } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { FaXTwitter } from 'react-icons/fa6'
import WhoamiTerminal from '@/components/features/WhoamiTerminal'
import FadeIn from '@/components/ui/FadeIn'
import HeroGrid from '@/components/sections/HeroGrid'
import HeroChainMeter from '@/components/sections/HeroChainMeter'
import HeroPortraitSwap from '@/components/sections/HeroPortraitSwap'

/** The portrait's rendered width at each breakpoint (its w-* classes below). */
const PORTRAIT_SIZES = '(max-width: 359px) 10rem, (max-width: 639px) 11rem, (max-width: 767px) 14rem, (max-width: 1023px) 21rem, 24rem'

/**
 * The hero, rendered on the server. Its entrances are CSS (FadeIn) from the
 * first paint, so nothing above the fold waits for hydration; only the grid
 * and the chain's wire meter run script (HeroGrid, HeroChainMeter).
 */
const Hero = () => {
  return (
    <div
      className="relative flex flex-col md:min-h-[min(calc(100svh-250px),1000px)] items-center bg-linear-to-b from-darkBlue from-70% to-transparent overflow-hidden select-none"
      id="home"
    >
      <HeroGrid />

      {/* Top-aligned, not centered: a slow device paints the hero while it is
          still streaming in, and re-centering a growing column shifted it up.
          From md up the hero is sized to the screen instead (svh, so nothing
          moves after load). Its min-height (100svh - 250px) leaves room under
          it for a sneak peek of "What I'm working on": the heading (~65px
          below the hero, ~60px tall) and the top of its card down to the
          logo row (~238px below the hero). The ~447px text column sits a
          little low in the space between the navbar (68px) and the next
          section's eyebrow (~47px below the hero): 60% of the spare height
          above it, 40% below, so on a big screen the gap down to "What I'm
          working on" stays small. Top padding
          68 + 0.6 * (100svh - 250 + 47 - 68 - 447) = 60svh - 363px, with no
          bottom padding; short screens keep at least 5.5rem. Capped where
          the hero's height is (1000px), so a very tall screen doesn't get an
          empty hero. tests/e2e/hero.spec.ts checks the laptop and tablet
          sizes. */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full flex flex-col items-center pt-24 md:pt-[clamp(5.5rem,calc(60svh-363px),24rem)] pb-16 md:pb-0">


        {/* On phones the portrait comes first (order-first), above the
            heading, so the face is on the first screen; from md up it sits
            to the right of the text. */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 md:gap-8">
          {/* Text */}
          <div className="flex-1 flex flex-col items-start gap-5 md:gap-4 min-w-0 w-full md:w-auto">

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
                // One line on every phone: the font scales with the screen
                // (the line is ~16.75em wide; 100vw less the 2.5rem gutter),
                // up to the usual 1.5rem. On tablets (md) the text column
                // shares the row with the portrait, so it drops to 1.2rem there.
                className="mt-3 whitespace-nowrap text-[min(1.5rem,calc((100vw-2.5rem)/17.5))] sm:text-3xl md:text-[1.2rem] lg:text-3xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text text-transparent"
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
                        i === 0 ? ' n8-first' : i < arr.length - 1 ? ' n8-split' : ''
                      }`}
                      style={{
                        // 9.2s loop, 1.8s chip spacing, phase-shifted -8.2s so the page loads
                        // pulse-mid-wire; the first chip (prompt) fires ~0.53s early so it
                        // lights as the wire lands.
                        ['--n8delay' as string]: `${(i === 0 ? -0.53 : i * 1.8) - 8.2}s`,
                        // prompt starts bottom-left (~8 o'clock), where the wire lands, and repeat
                        // at 9 o'clock; the split chips ignore --n8start (they sweep from
                        // 270deg +/- the angle).
                        ['--n8start' as string]:
                          i === 0 ? '153deg' : i === arr.length - 1 ? '172deg' : '0deg',
                        // prompt: sweep 207deg (ends at 3 o'clock) and a short tail;
                        // HeroChainMeter refines the start and sweep to the measured wire.
                        ...(i === 0 ? { ['--n8k' as string]: 0.92, ['--n8tail' as string]: '21.5%', ['--n8mid' as string]: '23.5%' } : {}),
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

            {/* The direct route for someone hiring: the developer portfolio. */}
            <FadeIn as="p" effect="in" delay={0.55} className="text-sm text-slate-400">
              Hiring?{' '}
              <a
                href="https://portfolio.n8builds.dev"
                className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200"
              >
                See my developer portfolio
              </a>
            </FadeIn>

            {/* Socials */}
            <FadeIn effect="in" delay={0.65} as="nav" aria-label="Social links" className="flex items-center gap-0.5 -ml-2">
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
          </div>

          {/* Portrait */}
          {/* Fades and scales in with the rest of the hero, but in plain CSS
              (hero-portrait-in, app/globals.css), not motion: the portrait is
              the page's LCP element, so its entrance starts on first paint
              from the server HTML instead of waiting for hydration. Reduced
              motion skips it, and the portrait shows at once. */}
          <div className="hero-portrait-in order-first self-start md:order-none md:self-auto w-40 h-40 min-[360px]:w-44 min-[360px]:h-44 sm:w-56 sm:h-56 md:w-84 md:h-84 lg:w-96 lg:h-96 relative shrink-0">
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
                sizes={PORTRAIT_SIZES}
                alt="Nathan Watkins - builder based in Los Angeles"
              />
              {/* The watercolor version fades in and out over the photo, once
                  the page has loaded (never under reduced motion). */}
              <HeroPortraitSwap sizes={PORTRAIT_SIZES} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
