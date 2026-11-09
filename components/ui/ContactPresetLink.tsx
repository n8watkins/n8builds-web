'use client'
import type { ReactNode } from 'react'
import { CONTACT_PRESET_EVENT, isContactPresetId } from '@/lib/contactPresets'
import { isOutbound } from '@/lib/referrals'

/**
 * A link that may lead into the contact form with a preset (lib/contactPresets.ts),
 * `/?inquiry=<id>#contact`: a real link, so it works before hydration and from
 * any page; on a page that has the form, it fills the form in place and
 * scrolls to it instead of reloading. Any other href is an ordinary link
 * (a new tab when it leaves the site).
 */
export default function ContactPresetLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const url = new URL(href, 'https://n8builds.dev')
  // A counted short link (/techforpros?from=...) leaves the site too.
  const internal = href.startsWith('/') && !isOutbound(href)
  const preset = internal ? url.searchParams.get('inquiry') : null
  return (
    <a
      href={href}
      className={className}
      {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      onClick={(e) => {
        if (!isContactPresetId(preset)) return
        const contact = document.getElementById(url.hash.slice(1) || 'contact')
        if (!contact || !document.getElementById('contact-form')) return
        e.preventDefault()
        window.dispatchEvent(new CustomEvent(CONTACT_PRESET_EVENT, { detail: preset }))
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        contact.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
        window.history.replaceState(window.history.state, '', url.hash || '#contact')
      }}
    >
      {children}
    </a>
  )
}
