'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { FiMail } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'
import { useTurnstileOnIntent } from '@/hooks/useTurnstileOnIntent'
import { cn } from '@/lib/utils'

const DIRECT_EMAIL = 'contact@n8builds.dev'
const FALLBACK_ERROR = `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`
const VERIFY_ERROR = `We couldn't verify your browser (an ad or privacy blocker can cause this). Please refresh and try again, or email me at ${DIRECT_EMAIL}.`

type State = { kind: 'idle' | 'sending' } | { kind: 'done'; email: string } | { kind: 'error'; message: string }

/**
 * The blog newsletter's sign-up: just an email address, with Turnstile (run
 * on the first focus or input, useTurnstileOnIntent) and a honeypot. The
 * address gets a confirm link (double opt-in, app/api/newsletter); the answer
 * is the same whether it is new or already on the list.
 * `variant`: "index" under the /blog header, "post" at the end of a post.
 */
export default function NewsletterSignup({
  turnstileSiteKey,
  variant,
}: {
  turnstileSiteKey: string
  variant: 'index' | 'post'
}) {
  const hydrated = useHydrated()
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const turnstile = useTurnstileOnIntent(turnstileSiteKey)
  const doneHeading = useRef<HTMLHeadingElement>(null)
  const id = `newsletter-${variant}`

  const busy = state.kind === 'sending'
  const ready = hydrated && !busy

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-newsletter={variant}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-linear-to-br from-slate-900/80 to-[#0b1324]/80 p-6 sm:p-8',
        variant === 'index' ? 'mt-10' : 'mt-14'
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-radial from-cyan-500/10 to-transparent to-70%" />
      {state.kind === 'done' ? (
        <div role="status" className="fade-in relative">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <FiMail className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id={`${id}-title`} ref={doneHeading} tabIndex={-1} className="mt-4 text-xl font-bold text-slate-50 focus:outline-none">
            Check your inbox
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
            If <span className="font-semibold text-slate-100">{state.email}</span> isn&rsquo;t subscribed yet, a link to confirm is on its
            way. Nothing is kept unless you click it: an unconfirmed address is deleted after 7 days.
          </p>
        </div>
      ) : (
        <div className="relative">
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">Newsletter</p>
          <h2 id={`${id}-title`} className="mt-2 text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
            {variant === 'post' ? 'Liked this? Get the next one by email' : 'Get new posts by email'}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#9cadc5] sm:text-base">
            One short email in any week with a new post. Nothing else, and one click to unsubscribe.
          </p>
          <form
            {...turnstile.intentProps}
            noValidate
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!ready) return
              const address = email.trim()
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
                setState({ kind: 'error', message: 'Please enter a valid email address.' })
                document.getElementById(`${id}-email`)?.focus()
                return
              }
              setState({ kind: 'sending' })
              const token = await turnstile.getToken()
              if (!token) return setState({ kind: 'error', message: VERIFY_ERROR })
              // Tokens are single-use: this one is spent once sent.
              turnstile.spend()
              try {
                const response = await fetch('/api/newsletter', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: address, turnstile: token, honeypot }),
                })
                const data = (await response.json().catch(() => ({}))) as { error?: unknown }
                if (response.ok) {
                  setState({ kind: 'done', email: address })
                  requestAnimationFrame(() => doneHeading.current?.focus())
                  return
                }
                setState({ kind: 'error', message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR })
              } catch {
                setState({ kind: 'error', message: FALLBACK_ERROR })
              }
              // The visitor will likely try again: have a fresh token ready.
              turnstile.prepare()
            }}
          >
            <div className="hidden">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor={`${id}-email`} className="sr-only">
                Email
              </label>
              <input
                id={`${id}-email`}
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                aria-describedby={state.kind === 'error' ? `${id}-error` : undefined}
                className="h-12 w-full min-w-0 rounded-lg sm:w-auto sm:flex-1 border border-slate-600 bg-slate-800/80 px-4 text-slate-100 placeholder-slate-400 transition-colors hover:border-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-75"
              />
              <button
                type="submit"
                disabled={!ready}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-r from-cyan-600 to-blue-700 px-6 text-sm font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {busy ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            {state.kind === 'error' && (
              <p
                id={`${id}-error`}
                role="alert"
                className="fade-in mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm leading-relaxed text-red-200"
              >
                {state.message}
              </p>
            )}
            {/* Invisible unless Cloudflare needs a challenge; see the contact form. */}
            {turnstile.widget}
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              You&rsquo;ll get a link to confirm first.{' '}
              <Link href="/privacy" className="text-slate-300 underline underline-offset-2 hover:text-cyan-300">
                Privacy
              </Link>
            </p>
          </form>
        </div>
      )}
    </section>
  )
}
