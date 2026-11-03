'use client'
import { useEffect, useRef, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { FiArrowRight, FiCheck } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'
import { useNearViewport } from '@/hooks/useNearViewport'

// How long to wait for Turnstile to issue a token after the visitor sends.
const TURNSTILE_WAIT_MS = 15_000
const DIRECT_EMAIL = 'contact@n8builds.dev'
const FALLBACK_ERROR = `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`
const VERIFY_ERROR = `We couldn't verify your browser (an ad or privacy blocker can cause this). Please refresh and try again, or email me at ${DIRECT_EMAIL}.`

/** The anchor the top section's "Get a quote" button lands on (data/now.tsx). */
export const QUOTE_ANCHOR = 'quote'

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; email: string }

/**
 * The Tech for Pros card's quote request (round 5 of 2026-11-02): an email
 * field and "Get my quote". It posts to the contact backend (/api/contact,
 * `kind: 'techforpros-quote'`: Turnstile, honeypot, rate limits, test mode),
 * which emails the owner a quote request with the visitor's address; nothing
 * is stored. Invisible Turnstile and a hidden honeypot, as the waitlist and the
 * contact form. Arriving at #quote (the top section's "Get a quote") focuses
 * the field. A clear success state replaces the form.
 */
export default function QuoteForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const hydrated = useHydrated()
  // Turnstile loads once the form is near the screen, not with the page (useNearViewport).
  const [formRef, near] = useNearViewport<HTMLFormElement>()
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [invalid, setInvalid] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const done = useRef<HTMLParagraphElement>(null)
  const token = useRef('')
  // Turnstile tokens are single-use: a new widget issues a fresh one after each send.
  const [widget, setWidget] = useState(0)
  const tokenWaiter = useRef<((token: string | null) => void) | null>(null)

  // "Get a quote" at the top of the page (or a link to /#quote) lands here, ready to type.
  useEffect(() => {
    const focus = () => {
      if (window.location.hash === `#${QUOTE_ANCHOR}`) input.current?.focus({ preventScroll: true })
    }
    focus()
    window.addEventListener('hashchange', focus)
    return () => window.removeEventListener('hashchange', focus)
  }, [])

  useEffect(() => {
    if (state.kind === 'done') done.current?.focus()
  }, [state.kind])

  const waitForToken = (): Promise<string | null> => {
    if (!turnstileSiteKey) return Promise.resolve('dev_bypass_token')
    if (token.current) return Promise.resolve(token.current)
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        tokenWaiter.current = null
        resolve(null)
      }, TURNSTILE_WAIT_MS)
      tokenWaiter.current = (value) => {
        clearTimeout(timer)
        resolve(value)
      }
    })
  }

  const submit = async () => {
    const address = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setInvalid(true)
      return input.current?.focus()
    }
    setState({ kind: 'sending' })
    const turnstile = await waitForToken()
    if (!turnstile) return setState({ kind: 'error', message: VERIFY_ERROR })
    token.current = ''
    setWidget((n) => n + 1)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'techforpros-quote', email: address, turnstile, honeypot }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok)
        return setState({
          kind: 'error',
          message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR,
        })
      setState({ kind: 'done', email: address })
    } catch {
      setState({ kind: 'error', message: FALLBACK_ERROR })
    }
  }

  if (state.kind === 'done') {
    return (
      <div
        id={QUOTE_ANCHOR}
        role="status"
        className="fade-in flex scroll-mt-28 items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4"
        data-quote-done
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
          <FiCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p ref={done} tabIndex={-1} className="font-bold text-slate-50 focus:outline-none">
            Got it. Your quote is on its way.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            I&apos;ll email <span className="font-semibold text-slate-100">{state.email}</span>{' '}
            myself, usually within a day.
          </p>
        </div>
      </div>
    )
  }

  const busy = state.kind === 'sending'
  const errorId = 'quote-email-error'
  return (
    <form
      ref={formRef}
      id={QUOTE_ANCHOR}
      noValidate
      className="scroll-mt-28"
      aria-label="Get a Tech for Pros quote"
      data-scroll-top-avoid
      onSubmit={(e) => {
        e.preventDefault()
        if (hydrated && !busy) submit()
      }}
    >
      {/* Security: honeypot, hidden from people. */}
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
      <label
        htmlFor="quote-email"
        className="text-[0.7rem] font-bold tracking-[0.1em] text-slate-450 uppercase min-[400px]:tracking-[0.16em]"
      >
        Where should the quote go?
      </label>
      <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
        <input
          ref={input}
          id="quote-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          required
          value={email}
          disabled={busy}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid || state.kind === 'error' ? errorId : undefined}
          onChange={(e) => {
            setEmail(e.target.value)
            setInvalid(false)
          }}
          className={`h-11 w-full min-w-0 rounded-xl sm:w-auto sm:flex-1 border bg-[#081120] px-3.5 text-[15px] text-slate-100 placeholder:text-slate-450 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:opacity-60 ${
            invalid
              ? 'border-rose-400/70'
              : 'border-white/12 hover:border-white/20 focus:border-sky-400/60'
          }`}
        />
        <button
          type="submit"
          disabled={!hydrated || busy}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1066f4] px-5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#3b82f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? 'Sending...' : 'Get my quote'}
          {!busy && <FiArrowRight aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      {invalid && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-rose-300">
          Please enter a valid email address.
        </p>
      )}
      {state.kind === 'error' && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-rose-300">
          {state.message}
        </p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-slate-450">
        Just your email. It comes straight to me, and this site doesn&apos;t store or share it.
      </p>
      {/* Invisible unless Cloudflare needs a challenge; see the contact form. */}
      {turnstileSiteKey && near && (
        <Turnstile
          key={widget}
          siteKey={turnstileSiteKey}
          onSuccess={(value) => {
            token.current = value
            tokenWaiter.current?.(value)
            tokenWaiter.current = null
          }}
          onExpire={() => {
            token.current = ''
          }}
          options={{ appearance: 'interaction-only', refreshExpired: 'auto' }}
          className="absolute"
        />
      )}
    </form>
  )
}
