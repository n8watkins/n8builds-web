import { FaXTwitter } from 'react-icons/fa6'
import { motion } from 'framer-motion'
import Image from 'next/image'
import ContactForm from '@/components/ContactForm'
import { ContactFormErrorBoundary } from '@/components/ContactFormErrorBoundary'
import { FiGithub, FiMail } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { fadeInUpVariants, fadeInVariants, staggerContainerVariants, staggerItemVariants, defaultAnimationConfig } from '@/lib/animations'

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

      <div className="flex flex-col items-center">
        {/* Header */}
        <motion.div
          variants={fadeInUpVariants}
          {...defaultAnimationConfig}
          id="contact"
          className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold py-14 text-slate-800 dark:text-slate-200 select-none lg:max-w-[45vw] mb-4">
            Want to work together or <span className="text-purple-500">follow the build?</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto px-5 leading-relaxed text-base md:text-lg">
            Reach out through the form, connect on socials, or head to Appturnity for consulting and project work.
          </p>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          variants={fadeInVariants}
          {...defaultAnimationConfig}
          className="w-full max-w-2xl mx-auto mb-8 px-4">
          <div className="bg-white/5 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl relative">
            <ContactFormErrorBoundary>
              <ContactForm />
            </ContactFormErrorBoundary>
            <div className="absolute bottom-4 right-4 opacity-70 select-none">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>🛡️</span>
                <span>Protected by reCAPTCHA v3</span>
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
                Nate Builds is the public lab. For custom projects, product builds, and technical consulting — let&apos;s connect through Appturnity.
              </p>
            </div>

            {/* Center */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <AppturnityLogo />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-slate-100 text-base">Appturnity</p>
                  <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
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
                href="https://appturnity.web.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-purple-900/30"
              >
                <span>Visit Appturnity</span>
                <span>↗</span>
              </a>
              <a
                href="https://nathansportfolio.vercel.app"
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">N8</span>
          </div>
          <span className="font-bold text-slate-200 text-sm">Nate Builds</span>
        </motion.div>

        <motion.p variants={staggerItemVariants} className="lg:text-sm text-xs text-slate-500">
          © 2025 Nate Builds. All rights reserved.
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
