'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { SiTwitch, SiYoutube } from 'react-icons/si'
import { FiExternalLink, FiMenu, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Lab', href: '/lab' },
    { label: 'Notions', href: '/blog' },
    { label: 'Extensions', href: '/extensions' },
    { label: 'Tools', href: '/tools' },
    { label: 'Loadout', href: '/loadout' },
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
                alt="Nate Builds"
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
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-all duration-150"
              >
                {l.label}
              </a>
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
              href="https://nathansportfolio.vercel.app"
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
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-300 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-colors"
              >
                {l.label}
              </a>
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
              href="https://nathansportfolio.vercel.app"
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
