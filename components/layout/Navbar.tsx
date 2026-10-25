'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiTwitch } from 'react-icons/si'
import { FiExternalLink, FiMenu, FiX, FiChevronDown } from 'react-icons/fi'
import { motion, AnimatePresence } from 'motion/react'
import { useLiveStatus } from '@/components/live/liveStore'
import NavLiveDot from '@/components/live/NavLiveDot'

// The Lab is one homepage section; its parts live in a hover dropdown so the
// top nav stays short. Each item scrolls to its anchor on the homepage.
const labMenu = [
  { label: 'Featured', href: '/#featured', desc: 'The builds I use every day' },
  { label: 'Chrome Extensions', href: '/#extensions', desc: 'Browser tools, local-first' },
]

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)
  const pathname = usePathname()
  // Set while Escape returns focus to the Lab link, so that focus doesn't reopen it.
  const skipFocusOpen = useRef(false)

  const menuButton = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    // A page can load already scrolled (a #anchor link, a reload mid-page).
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The open mobile menu is an overlay: the page behind it doesn't scroll or
  // take focus (everything but the navbar and the menu is inert), Escape closes
  // it (focus returns to the toggle), and so does widening the window past the
  // breakpoint where the menu stops existing.
  useEffect(() => {
    if (!mobileOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const keep = [navRef.current, document.getElementById('mobile-menu'), document.getElementById('mobile-menu-backdrop')].filter(
      (el): el is HTMLElement => el !== null,
    )
    const inerted: Element[] = []
    for (let node = keep[0]; node && node !== document.body; node = node.parentElement!) {
      for (const sibling of Array.from(node.parentElement?.children ?? [])) {
        if (keep.some((k) => sibling.contains(k)) || sibling.hasAttribute('inert')) continue
        if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue
        sibling.setAttribute('inert', '')
        inerted.push(sibling)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMobileOpen(false)
      menuButton.current?.focus()
    }
    const desktop = window.matchMedia('(min-width: 64rem)')
    const onWiden = () => desktop.matches && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onWiden)
    return () => {
      document.body.style.overflow = overflow
      inerted.forEach((el) => el.removeAttribute('inert'))
      window.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onWiden)
    }
  }, [mobileOpen])

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

  // Top-level items besides the Lab dropdown: the build log page, then links
  // that scroll to their homepage section.
  const navLinks = [
    { label: 'Log', href: '/builds' },
    { label: 'Notions', href: '/#notions' },
    { label: 'Loadout', href: '/#loadout' },
  ]
  // While live on Twitch, the link gets a live dot and points at the stream.
  const twitchLive = useLiveStatus()?.streams.find((s) => s.platform === 'twitch')
  const socialLinks = [
    {
      label: 'Twitch',
      href: twitchLive?.url ?? 'https://twitch.tv/n8watkins',
      live: Boolean(twitchLive),
      icon: <SiTwitch className="w-3.5 h-3.5" />,
      hoverColor: 'hover:text-purple-400',
    },
    // YouTube goes back here, after Twitch, once the channel is live (see HANDOFF).
  ]

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Primary"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-darkBlue/92 backdrop-blur-2xl border-b border-white/[0.07]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" aria-label="n8builds.dev home" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-200">
              <Image
                src="/tab/n8-logo.png"
                alt=""
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-[0.95rem] hidden sm:block">
              n8builds.dev
            </span>
          </Link>

          {/* Desktop nav. From lg up: below that the links and the right-hand
              buttons don't fit on one row (tablets got the Appturnity CTA
              pushed off-screen), so the menu button takes over. */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Lab dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setLabOpen(true)}
              onMouseLeave={() => setLabOpen(false)}
              // Keyboard: close once focus moves past the menu, or on Escape.
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setLabOpen(false)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Escape' || !labOpen) return
                setLabOpen(false)
                skipFocusOpen.current = true
                e.currentTarget.querySelector('a')?.focus()
                skipFocusOpen.current = false
              }}
            >
              <Link
                href="/#lab"
                onClick={(e) => goToSection(e, '/#lab')}
                onFocus={() => {
                  if (!skipFocusOpen.current) setLabOpen(true)
                }}
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
                    <div className="rounded-xl border border-white/8 bg-[#070b16]/97 backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/50">
                      {labMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => goToSection(e, item.href)}
                          className="group/item flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-white/6 transition-colors"
                        >
                          <span className="text-sm font-semibold text-slate-200 transition-colors group-hover/item:text-cyan-300">
                            {item.label}
                          </span>
                          <span className="text-xs text-slate-450">{item.desc}</span>
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
                aria-current={pathname === l.href ? 'page' : undefined}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-100 aria-[current=page]:text-slate-100 rounded-lg hover:bg-white/5 transition-all duration-150"
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
                {l.live && <NavLiveDot />}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-900/30"
            >
              Appturnity
              <FiExternalLink className="w-3 h-3" />
            </a>
            {/* Mobile toggle */}
            <button
              ref={menuButton}
              type="button"
              className="lg:hidden w-11 h-11 -mr-1.5 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
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
            key="backdrop"
            id="mobile-menu-backdrop"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-[68px] z-40 bg-black/50 lg:hidden"
          />
        )}
        {mobileOpen && (
          <motion.div
            key="menu"
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[68px] left-0 right-0 z-40 max-h-[calc(100dvh-68px)] overflow-y-auto overscroll-contain bg-darkBlue/96 backdrop-blur-2xl border-b border-white/[0.07] px-5 py-4 flex flex-col gap-1 lg:hidden"
          >
            {/* Lab group */}
            <p className="px-3 pt-1 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-475">
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
                aria-current={pathname === l.href ? 'page' : undefined}
                className="px-3 py-2.5 text-sm text-slate-300 hover:text-slate-100 aria-[current=page]:text-cyan-300 rounded-lg hover:bg-white/5 transition-colors"
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
                {l.live && <NavLiveDot />}
              </a>
            ))}
            <hr className="border-white/8 my-1" />
            <a
              href="https://portfolio.n8builds.dev"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
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
