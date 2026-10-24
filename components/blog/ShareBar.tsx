'use client'
import { useState } from 'react'
import { FiCheck, FiLink } from 'react-icons/fi'
import { FaXTwitter } from 'react-icons/fa6'

/** The X compose link for a post: its title, its link and a credit to @n8watkins. */
export function xShareUrl(title: string, url: string) {
  const params = new URLSearchParams({ text: title, url, via: 'n8watkins' })
  return `https://x.com/intent/post?${params}`
}

/**
 * "Share this note" at the end of a post: open X with the post filled in, or
 * copy the link. The copy falls back to selecting text when the Clipboard API
 * isn't available (an insecure context or an old browser).
 */
export default function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const field = document.createElement('textarea')
      field.value = url
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const button =
    'inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl sm:flex-none border border-white/10 bg-white/4 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-white/[0.07] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'

  return (
    <section aria-label="Share this note" className="mt-14 flex flex-wrap items-center gap-3 border-t border-white/8 pt-8">
      <p className="w-full text-sm font-bold uppercase tracking-widest text-slate-450 sm:mr-2 sm:w-auto">Share this note</p>
      <a href={xShareUrl(title, url)} target="_blank" rel="noopener noreferrer" className={button}>
        <FaXTwitter className="h-4 w-4" />
        Share on X
      </a>
      <button type="button" onClick={copy} className={button}>
        {copied ? <FiCheck className="h-4 w-4 text-emerald-400" /> : <FiLink className="h-4 w-4" />}
        <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
      </button>
    </section>
  )
}
