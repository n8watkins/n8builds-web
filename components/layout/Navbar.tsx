'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SiTwitch } from 'react-icons/si'
import { FiMenu, FiX, FiChevronDown, FiBriefcase } from 'react-icons/fi'
import { useLiveStatus } from '@/components/live/liveStore'
import NavLiveDot from '@/components/live/NavLiveDot'
import { refHref } from '@/lib/referrals'
import { TECH_FOR_PROS } from '@/lib/techForPros'
import TechForProsMark from '@/components/ui/TechForProsMark'

// The Lab is one homepage section; its parts live in a hover dropdown so the
// top nav stays short. Each item scrolls to its anchor on the homepage.
// `fallback`: where an item goes when its section isn't on the page (the build
// log hides when the log can't load): the full log.
type LabItem = { label: string; href: string; desc: string; fallback?: string }
const labMenu: LabItem[] = [
  // The build log sits under "What I'm working on", just above the Lab (owner, 2026-11-08),
  // so it leads the menu, in page order; the full log is its "See the full build log" link and the footer.
  { label: 'Build log', href: '/#build-log', desc: 'What I shipped lately, every build', fallback: '/builds' },
  { label: 'Featured', href: '/#featured', desc: 'OpenPing and Solara' },
  { label: 'Chrome Extensions', href: '/#extensions', desc: 'Browser tools, local-first' },
  // The Lab's last part: upcoming projects, each with a waitlist (full detail on /upcoming).
  { label: "What's cookin'", href: '/#upcoming', desc: 'Upcoming projects, with a waitlist' },
]

// The menus open and close with CSS transitions, not motion, so no page loads
// the animation library just to render its navbar. Closed, a menu stays in
// the DOM but invisible (out of the tab order and the accessibility tree);
// `visibility` waits for the fade to end, so closing still animates.
const shown = 'visible opacity-100 translate-y-0'
const hidden = 'invisible pointer-events-none opacity-0'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
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
  // On other pages we fall through and let the link navigate to "/#id". A
  // section missing from the homepage sends its item to its fallback page.
  const goToSection = (e: React.MouseEvent, href: string, fallback?: string) => {
    setLabOpen(false)
    setMobileOpen(false)
    if (!href.startsWith('/#')) return
    if (typeof window === 'undefined' || window.location.pathname !== '/') return
    const el = document.getElementById(href.slice(2))
    if (!el) {
      if (fallback) {
        e.preventDefault()
        router.push(fallback)
      }
      return
    }
    e.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // A frame later, once the mobile menu has closed: while it is open the body
    // has overflow: hidden, and WebKit then counts scroll-padding-top twice,
    // landing the section 80px low (the contact form below the fold on an iPhone).
    requestAnimationFrame(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }))
    window.history.replaceState(null, '', href)
  }

  // The logo goes home; on the homepage it goes back to the top, smoothly
  // unless reduced motion is on (round 5 of 2026-11-02), and drops any #part
  // from the address.
  const goHome = (e: React.MouseEvent) => {
    setMobileOpen(false)
    if (typeof window === 'undefined' || window.location.pathname !== '/') return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' }))
    window.history.replaceState(null, '', '/')
  }

  // Arriving on the homepage at a Lab item's section that isn't there (the build
  // log hides when the log can't load), from another page: go to its fallback.
  // A hash change counts too: a click before hydration jumps natively.
  useEffect(() => {
    if (pathname !== '/') return
    const check = () => {
      const item = labMenu.find((i) => i.fallback && window.location.hash === i.href.slice(1))
      if (item?.fallback && !document.getElementById(item.href.slice(2))) router.replace(item.fallback)
    }
    check()
    const onHash = () => check()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [pathname, router])

  // Top-level items besides the Lab dropdown: links that scroll to their
  // homepage section.
  const navLinks = [
    { label: 'Notions', href: '/#notions' },
    { label: 'Loadout', href: '/#loadout' },
    // The contact form is at the foot of the homepage.
    { label: 'Contact', href: '/#contact' },
  ]
  // Twitch shows only while live (with a live dot, pointing at the stream):
  // the owner streams on YouTube and X, so it stays hidden otherwise.
  const twitchLive = useLiveStatus()?.streams.find((s) => s.platform === 'twitch')
  const socialLinks = [
    twitchLive && {
      label: 'Twitch',
      href: twitchLive?.url ?? 'https://twitch.tv/n8watkins',
      live: Boolean(twitchLive),
      icon: <SiTwitch className="w-3.5 h-3.5" />,
      hoverColor: 'hover:text-purple-400',
    },
    // YouTube goes back here, after Twitch, once the channel is live (see HANDOFF).
  ].filter((l) => !!l)

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
        <div className="max-w-site mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" onClick={goHome} aria-label="n8builds.dev home" className="flex items-center gap-2.5 shrink-0 group">
            {/* The brand mark on its own (the tab icon puts it on a tile). */}
            <Image
              src="/brand/n8-mark.png"
              alt=""
              width={1086}
              height={826}
              sizes="34px"
              className="h-[26px] w-auto transition-opacity duration-200 group-hover:opacity-85"
            />
            <span className="font-bold text-slate-100 tracking-tight text-[0.95rem] hidden sm:block">
              n8builds.dev
            </span>
          </Link>

          {/* Desktop nav. From lg up: below that the links and the right-hand
              buttons don't fit on one row (tablets got the CTA
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
              <div
                className={`absolute left-0 top-full w-64 pt-2 transition-[opacity,translate,visibility] duration-150 motion-reduce:transition-none ${
                  labOpen ? shown : `${hidden} translate-y-1.5`
                }`}
              >
                <div className="rounded-xl border border-white/8 bg-[#070b16]/97 backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/50">
                  {labMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => goToSection(e, item.href, item.fallback)}
                      className="group/item flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-white/6 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-200 transition-colors group-hover/item:text-cyan-300">
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-450">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
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
            {/* Divides the live stream links from the rest; nothing to divide while none is live. */}
            {socialLinks.length > 0 && <span className="w-px h-4 bg-white/12 mx-2" />}
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
                {l.href.startsWith('http') && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <a
              // Every Portfolio link goes through the counted short link, in a new tab (2026-11-08).
              href={refHref('portfolio', 'navbar')}
              target="_blank"
              rel="noopener noreferrer"
              // The briefcase gives a small shake on hover or focus (round 8 of 2026-11-09; `.nav-briefcase`, app/globals.css).
              className="group/pf hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-slate-200 hover:text-white border border-white/15 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all duration-150"
            >
              <FiBriefcase className="nav-briefcase w-4 h-4" aria-hidden />
              Portfolio
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {/* My company, by its address (owner, 2026-11-01): a bordered pill
                like Portfolio (same height, radius and border, with a
                faint brand tint), holding its icon and techforpros.com over a
                clean curved underline, the style of the old Appturnity hero's
                (round 3 of 2026-11-02: one smooth arc, no hand-drawn wobble),
                shown only on hover or focus, drawing in (round 8 of 2026-11-09). Shown at every width; on a 320px phone it still
                fits between the logo and the menu button
                (tests/e2e/navigation.spec.ts). */}
            <a
              href={refHref('techforpros', 'navbar')}
              target="_blank"
              rel="noopener noreferrer"
              data-nav-techforpros
              className="group/tfp flex shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-cyan-400/[0.05] py-1.5 pl-1.5 pr-3 text-sm font-semibold text-slate-100 transition-all duration-150 hover:border-cyan-300/35 hover:bg-cyan-400/[0.09] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 min-[360px]:pr-3.5"
            >
              <TechForProsMark className="h-5 w-5 rounded-[6px] shadow-none" sizes="20px" />
              <span className="relative">
                {TECH_FOR_PROS.domain}
                <svg
                  aria-hidden="true"
                  className="tfp-underline pointer-events-none absolute -bottom-[4px] left-0 h-[6px] w-full overflow-visible"
                  viewBox="0 0 116 6"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="tfp-underline-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#22d3ee" />
                      <stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  {/* One shallow, symmetric arch (round 5 of 2026-11-02: "I want
                      it symmetrical", then flipped: its highest point in the
                      middle): it starts and ends the same 4 units in from the
                      label's edges, at the same height, and rises only about a
                      pixel to its peak under the label's centre, close under
                      the letters (2px higher than first, the owner's ask). The viewBox is
                      the text's own size (about 116 by 6 px), so the stretch is
                      near 1:1 and the stroke stays even. Nothing at rest: it draws
                      in from the left on hover or keyboard focus (round 8 of
                      2026-11-09; `.tfp-underline`, app/globals.css). */}
                  <path
                    d="M4 4.2 Q 58 1.8, 112 4.2"
                    pathLength={100}
                    fill="none"
                    stroke="url(#tfp-underline-gradient)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="sr-only"> ({TECH_FOR_PROS.name}, opens in a new tab)</span>
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
      <div
        id="mobile-menu-backdrop"
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 top-[68px] z-40 bg-black/50 transition-[opacity,visibility] duration-180 motion-reduce:transition-none lg:hidden ${
          mobileOpen ? shown : hidden
        }`}
      />
      <div
        id="mobile-menu"
        className={`fixed top-[68px] left-0 right-0 z-40 max-h-[calc(100dvh-68px)] overflow-y-auto overscroll-contain bg-darkBlue/96 backdrop-blur-2xl border-b border-white/[0.07] px-5 py-4 flex flex-col gap-1 transition-[opacity,translate,visibility] duration-180 motion-reduce:transition-none lg:hidden ${
          mobileOpen ? shown : `${hidden} -translate-y-2`
        }`}
      >
        {/* Lab group */}
        <p className="px-3 pt-1 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-475">
          Lab
        </p>
        {labMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => goToSection(e, item.href, item.fallback)}
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
            {l.href.startsWith('http') && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        ))}
        <hr className="border-white/8 my-1" />
        <a
          href={refHref('portfolio', 'navbar')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className="px-3 py-2.5 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-colors"
        >
          Portfolio <span aria-hidden>↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </>
  )
}

export default Navbar
