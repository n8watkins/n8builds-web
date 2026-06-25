import { FaXTwitter } from 'react-icons/fa6'
import { motion } from 'framer-motion'
import Image from 'next/image'
import ContactForm from '@/components/ContactForm'
import { ContactFormErrorBoundary } from '@/components/ContactFormErrorBoundary'
import { FiGithub, FiMail } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants, defaultAnimationConfig } from '@/lib/animations'

const AppturnityLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="apt-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#36e8ff" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    {/* Stylized A / upward arrow triangle */}
    <path d="M24 6 L40 38 H8 Z" fill="none" stroke="url(#apt-grad)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M15 38 L24 20 L33 38" fill="none" stroke="url(#apt-grad)" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
    <circle cx="24" cy="6" r="2.5" fill="url(#apt-grad)" />
  </svg>
)

const Footer = () => {
  return (
    <footer className="xl:max-w-5xl pt-0 pb-12">
      {/* Background grid */}
      <div className="w-full absolute left-0 1sm:-translate-y-52 -bottom-72 min-h-96 pointer-events-none">
        <Image
          src="/footer-grid.svg"
          alt=""
          className="w-full h-full opacity-50 z-10 pointer-events-none"
          fill
          sizes="100vw"
        />
      </div>

      <div className="flex flex-col items-center pt-14">
        {/* Contact card — branded panel + form, with decorative artifacts */}
        <motion.div
          variants={fadeInVariants}
          {...defaultAnimationConfig}
          className="w-full max-w-5xl mx-auto mb-12 px-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#08152a] via-[#0a1a33] to-[#07101f] shadow-2xl">
            {/* decorative glows + grid */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
              <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            </div>
            {/* top accent line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />

            <div className="relative grid gap-8 p-7 md:grid-cols-[0.9fr_1.1fr] md:p-10">
              {/* Left — branded panel */}
              <div className="flex flex-col gap-5">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Building in public
                </span>

                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 blur-lg" />
                    <Image
                      src="/hero/portrait.jpg"
                      alt="Nathan Watkins"
                      fill
                      sizes="64px"
                      className="relative rounded-2xl object-cover ring-1 ring-white/15"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-50">Nathan &quot;n8&quot; Watkins</p>
                    <p className="font-mono text-xs text-cyan-400">building software in public</p>
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-50">
                  Want to work together or{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    follow the build?
                  </span>
                </h2>
                <p className="text-[#9cadc5] leading-relaxed">
                  Drop a message, connect on socials, or head to Appturnity for consulting and
                  project work. I usually reply within a day.
                </p>

                {/* socials */}
                <div className="mt-auto flex items-center gap-2">
                  {[
                    { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="w-4.5 h-4.5" /> },
                    { href: 'https://x.com/n8watkins', label: 'X (Twitter)', icon: <FaXTwitter className="w-4 h-4" /> },
                    { href: 'https://www.linkedin.com/in/n8watkins/', label: 'LinkedIn', icon: <CiLinkedin className="w-5 h-5" /> },
                    { href: 'mailto:nathancwatkins23@gmail.com', label: 'Email', icon: <FiMail className="w-4.5 h-4.5" /> },
                  ].map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.href.startsWith('http') ? '_blank' : undefined}
                      rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-200 hover:scale-[1.05] hover:border-cyan-400/30 hover:text-cyan-300"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Right — form */}
              <div className="relative rounded-2xl border border-white/10 bg-[#050c18]/60 p-5 backdrop-blur-sm sm:p-6">
                <ContactFormErrorBoundary>
                  <ContactForm />
                </ContactFormErrorBoundary>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 select-none">
                  <span>🛡️</span>
                  <span>Protected by Cloudflare Turnstile</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appturnity + Portfolio CTA banner */}
        <motion.div
          variants={fadeInVariants}
          {...defaultAnimationConfig}
          className="w-full max-w-4xl mx-auto mb-10 px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-white/10 bg-white/3 dark:bg-slate-900/40 backdrop-blur-sm">
            {/* Left */}
            <div className="text-center md:text-left max-w-xs">
              <p className="font-bold text-slate-100 text-base mb-1">Need something built?</p>
              <p className="text-slate-500 text-sm leading-relaxed">
                n8builds is the public lab. For project work and consulting, let&apos;s connect through Appturnity. Looking to hire me on a contract or full-time basis? View my portfolio.
              </p>
            </div>

            {/* Center */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <AppturnityLogo />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-slate-100 text-base">Appturnity</p>
                  <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    The Consulting Studio
                  </span>
                </div>
                <p className="text-slate-400 text-sm">Strategy. Product. Engineering.</p>
                <p className="text-slate-500 text-xs">Built to ship.</p>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href="https://appturnity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-900/30"
              >
                <span>Visit Appturnity</span>
                <span>↗</span>
              </a>
              <a
                href="https://portfolio.n8builds.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
              >
                <span>View Portfolio</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <motion.div
        variants={staggerContainerVariants}
        {...defaultAnimationConfig}
        className="flex mt-4 lg:flex-row flex-col-reverse justify-center xl:justify-between items-center gap-6 lg:mx-10 pt-6 border-t border-white/8">
        <motion.div variants={staggerItemVariants} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-white/10">
            <Image
              src="/tab/n8-logo.png"
              alt="n8builds"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-slate-200 text-sm">n8builds</span>
        </motion.div>

        <motion.p variants={staggerItemVariants} className="lg:text-sm text-xs text-slate-500">
          © 2026 n8builds. All rights reserved. ·{' '}
          <a href="/privacy" className="hover:text-slate-300 underline underline-offset-2">
            Privacy
          </a>
        </motion.p>

        <motion.nav
          variants={staggerItemVariants}
          aria-label="Footer social media links"
          className="flex items-center justify-center gap-1 z-50">
          <a href="https://github.com/n8watkins" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
            <FiGithub className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" aria-hidden="true" />
          </a>
          <a href="https://x.com/n8watkins" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
            <FaXTwitter className="w-4.5 h-4.5 text-slate-400 hover:text-slate-200 transition-colors" aria-hidden="true" />
          </a>
          <a href="https://www.linkedin.com/in/n8watkins/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
            <CiLinkedin className="w-5.5 h-5.5 text-slate-400 hover:text-slate-200 transition-colors" aria-hidden="true" />
          </a>
          <a href="mailto:nathancwatkins23@gmail.com" aria-label="Email"
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
            <FiMail className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" aria-hidden="true" />
          </a>
        </motion.nav>
      </motion.div>
    </footer>
  )
}

export default Footer
