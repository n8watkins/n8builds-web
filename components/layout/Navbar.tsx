'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SiTwitch, SiYoutube } from 'react-icons/si'
import { FiExternalLink, FiMenu, FiX, FiChevronDown } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

// The Lab is the umbrella — its sub-shelves live in a hover dropdown so the top
// nav stays short. Each item routes to its existing shelf page.
const labMenu = [
  { label: 'The Lab', href: '/#lab', desc: "Everything I'm building" },
  { label: 'Chrome Extensions', href: '/#extensions', desc: 'Browser tools, local-first' },
  { label: 'Tools', href: '/#tools', desc: 'Desktop apps, bots & utilities' },
  { label: 'Resources', href: '/#resources', desc: 'Free dev directories' },
]

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Smooth-scroll to a homepage section when a "/#id" nav link is clicked while
  // already on the homepage. next/link's same-page hash scroll is unreliable, so
  // we drive it directly (scrollIntoView honors html { scroll-padding-top }).
  // On other pages we fall through and let the link navigate to "/#id".
  const goToSection = (e: React.MouseEvent, href: string) => {
    setLabOpen(false)
    setMobileOpen(false)
    if (!href.startsWith('/#')) return
    if (typeof window === 'undefined' || window.location.pathname !== '/') return
    const el = document.getElementById(href.slice(2))
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    window.history.replaceState(null, '', href)
  }

  // Top-level items besides the Lab dropdown — each scrolls to its homepage section.
  const navLinks = [
    { label: 'Notions', href: '/#notions' },
    { label: 'Loadout', href: '/#loadout' },
  ]
  const socialLinks = [
    {
      label: 'Twitch',
      href: 'https://twitch.tv/n8watkins',
      icon: <SiTwitch className="w-3.5 h-3.5" />,
      hoverColor: 'hover:text-purple-400',
    },
    {
      label: 'YouTube',
      href: 'https://youtube.com/@n8watkins',
      icon: <SiYoutube className="w-4 h-4" />,
      hoverColor: 'hover:text-red-400',
    },
    { label: 'VibeLoge', href: '/builds/vibelog', icon: null, hoverColor: 'hover:text-cyan-400' },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050812]/92 backdrop-blur-2xl border-b border-white/[0.07]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-6">
          {/* Brand */}
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-200">
              <Image
                src="/tab/n8-logo.png"
                alt="n8builds"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-[0.95rem] hidden sm:block">
              n8builds.dev
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Lab dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setLabOpen(true)}
              onMouseLeave={() => setLabOpen(false)}
            >
              <Link
                href="/#lab"
                onClick={(e) => goToSection(e, '/#lab')}
                onFocus={() => setLabOpen(true)}
                aria-haspopup="true"
                aria-expanded={labOpen}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-all duration-150"
              >
                Lab
                <FiChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${labOpen ? 'rotate-180' : ''}`}
                />
              </Link>
              <AnimatePresence>
                {labOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full w-64 pt-2"
                  >
                    <div className="rounded-xl border border-white/[0.08] bg-[#070b16]/97 backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/50">
                      {labMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => goToSection(e, item.href)}
                          className="group/item flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                        >
                          <span className="text-sm font-semibold text-slate-200 transition-colors group-hover/item:text-cyan-300">
                            {item.label}
                          </span>
                          <span className="text-xs text-slate-500">{item.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={(e) => goToSection(e, l.href)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-all duration-150"
              >
                {l.label}
              </Link>
            ))}
            <span className="w-px h-4 bg-white/12 mx-2" />
            {socialLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 ${l.hoverColor} rounded-lg hover:bg-white/5 transition-all duration-150`}
              >
                {l.icon}
                {l.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <a
              href="https://portfolio.n8builds.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all duration-150"
            >
              Portfolio
            </a>
            <a
              href="https://appturnity.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-900/30"
            >
              Appturnity
              <FiExternalLink className="w-3 h-3" />
            </a>
            {/* Mobile toggle */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[68px] left-0 right-0 z-40 bg-[#050812]/96 backdrop-blur-2xl border-b border-white/[0.07] px-5 py-4 flex flex-col gap-1 md:hidden"
          >
            {/* Lab group */}
            <p className="px-3 pt-1 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-600">
              Lab
            </p>
            {labMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => goToSection(e, item.href)}
                className="px-3 py-2.5 text-sm text-slate-300 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-white/8 my-1" />
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={(e) => goToSection(e, l.href)}
                className="px-3 py-2.5 text-sm text-slate-300 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {socialLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400 ${l.hoverColor} rounded-lg hover:bg-white/5 transition-colors`}
              >
                {l.icon}
                {l.label}
              </a>
            ))}
            <hr className="border-white/8 my-1" />
            <a
              href="https://portfolio.n8builds.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-colors"
            >
              Portfolio ↗
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
