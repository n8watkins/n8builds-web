'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiCheck, FiMail } from 'react-icons/fi'
import { ContactInput } from '@/components/ui/ContactInput'
import { errorId } from '@/components/ui/FieldWrapper'
import { useHydrated } from '@/hooks/useHydrated'
import { useTurnstileOnIntent } from '@/hooks/useTurnstileOnIntent'
import { UPCOMING, interestSlug, isListed, isUpcomingSlug, type UpcomingSlug } from '@/data/upcoming'
import { PICK_EVENT } from './JoinButton'

const DIRECT_EMAIL = 'contact@n8builds.dev'
const FALLBACK_ERROR = `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`
const VERIFY_ERROR = `We couldn't verify your browser (an ad or privacy blocker can cause this). Please refresh and try again, or email me at ${DIRECT_EMAIL}.`

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; message: string } | { kind: 'done'; email: string }

/**
 * The waitlist form on /upcoming and the homepage: email, projects, a hidden
 * honeypot and invisible Turnstile (as the contact form). No note field (owner,
 * 2026-11-02); the API still accepts an entry with or without one. It ticks the project
 * from `?interest=` (the projects' landing pages link here with it) and from
 * a card's "Join" button, and sends where the visitor came from with the entry.
 * No zod on the client: the browser checks the email and the server checks it all.
 */
export default function WaitlistForm({
  turnstileSiteKey,
  layout = 'page',
}: {
  turnstileSiteKey: string
  /**
   * "side": beside /upcoming's cards from 1024px, so one column of picks there.
   * "modal": the homepage's waitlist modal, where a pick is its mark and name
   * only (two to a row from 640px), so the projects fit without much scrolling.
   */
  layout?: 'page' | 'side' | 'modal'
}) {
  const side = layout === 'side'
  const modal = layout === 'modal'
  const hydrated = useHydrated()
  // Turnstile runs on the first focus or input in the form, or a pick from a card (useTurnstileOnIntent).
  const turnstile = useTurnstileOnIntent(turnstileSiteKey)
  const { prepare } = turnstile
  const [email, setEmail] = useState('')
  const [projects, setProjects] = useState<UpcomingSlug[]>([])
  // An unlisted project (data/upcoming.ts) is offered only to a visitor whose link asked for it.
  const [arrivedFor, setArrivedFor] = useState<UpcomingSlug | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [errors, setErrors] = useState<{ email?: string; projects?: string }>({})
  const source = useRef<{ interest?: string; referrer?: string }>({})
  const doneHeading = useRef<HTMLHeadingElement>(null)

  // Arriving from a landing page: ?interest=<slug> ticks that project.
  useEffect(() => {
    const interest = new URLSearchParams(window.location.search).get('interest') ?? undefined
    source.current = { interest, referrer: document.referrer || undefined }
    // Old names (?interest=rewire) tick the renamed project.
    const slug = interestSlug(interest)
    // Read once on arrival, from the address bar: setting state here is the point.
    if (!slug) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects((list) => (list.includes(slug) ? list : [...list, slug]))
    if (UPCOMING.some((p) => p.slug === slug && !isListed(p))) {
      setArrivedFor(slug)
      // Its landing page links to its card (#<slug>), which an unlisted project doesn't have:
      // bring the form into view instead, so the visitor isn't left at the top of the page.
      if (window.location.hash === `#${slug}`) document.getElementById('waitlist')?.scrollIntoView()
    }
  }, [])

  // A card's "Join the <name> waitlist" button.
  useEffect(() => {
    const onPick = (e: Event) => {
      const slug = (e as CustomEvent<unknown>).detail
      if (!isUpcomingSlug(slug)) return
      setProjects((list) => (list.includes(slug) ? list : [...list, slug]))
      setErrors((current) => ({ ...current, projects: undefined }))
      prepare()
    }
    window.addEventListener(PICK_EVENT, onPick)
    return () => window.removeEventListener(PICK_EVENT, onPick)
  }, [prepare])

  useEffect(() => {
    if (state.kind === 'done') doneHeading.current?.focus()
  }, [state.kind])

  const toggle = (slug: UpcomingSlug) => {
    setProjects((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]))
    setErrors((current) => ({ ...current, projects: undefined }))
  }

  const submit = async () => {
    const found: typeof errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = 'Please enter a valid email address'
    if (projects.length === 0) found.projects = 'Pick at least one project'
    setErrors(found)
    if (found.email) return document.getElementById('waitlist-email')?.focus()
    if (found.projects) return document.querySelector<HTMLInputElement>('#waitlist-projects input')?.focus()

    setState({ kind: 'sending' })
    const token = await turnstile.getToken()
    if (!token) return setState({ kind: 'error', message: VERIFY_ERROR })
    // Tokens are single-use: this one is spent once sent.
    turnstile.spend()

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), projects, source: source.current, turnstile: token, honeypot }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) return setState({ kind: 'done', email: email.trim() })
      setState({ kind: 'error', message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR })
    } catch {
      setState({ kind: 'error', message: FALLBACK_ERROR })
    }
    // The visitor will likely try again: have a fresh token ready.
    turnstile.prepare()
  }

  if (state.kind === 'done') {
    return (
      <div role="status" className="fade-in flex flex-col items-center py-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
          <FiMail className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 ref={doneHeading} tabIndex={-1} className="mt-4 text-xl font-bold text-slate-50 focus:outline-none">
          Check your inbox
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
          I sent a link to <span className="font-semibold text-slate-100">{state.email}</span>. Click it to confirm your spot.
          Nothing is kept unless you do: an unconfirmed request is deleted after 7 days.
        </p>
        <p className="mt-3 text-sm text-slate-450">No email in a few minutes? Check your spam folder.</p>
      </div>
    )
  }

  const busy = state.kind === 'sending'

  return (
    <form
      {...turnstile.intentProps}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (hydrated && !busy) submit()
      }}
      className={side ? 'space-y-6 lg:space-y-4' : modal ? 'space-y-5' : 'space-y-6'}
      // The scroll-to-top button steps aside instead of covering a field (components/ui/ScrollToTop.tsx).
      data-scroll-top-avoid
      aria-describedby={state.kind === 'error' ? 'waitlist-error' : undefined}
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

      <ContactInput
        id="waitlist-email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
        }}
        error={errors.email}
        disabled={busy}
      />

      <fieldset
        id="waitlist-projects"
        aria-describedby={errors.projects ? errorId('waitlist-projects') : undefined}
        aria-invalid={errors.projects ? true : undefined}
      >
        <legend className="text-sm font-medium text-slate-200">Which projects?</legend>
        {/* Beside the homepage cards (side, 1024px up) a pick is its icon and name
            only: the card beside it has the tagline. One column, then two by two
            from 1280px, so the cards and the panel fit a 1280x800 screen. An odd
            last pick spans both columns, so it never sits alone in half a row. */}
        <div
          className={`mt-2 grid sm:grid-cols-2 ${modal ? 'gap-2' : 'gap-2.5'} ${side ? 'lg:grid-cols-1 lg:gap-2 xl:grid-cols-2' : ''}`}
        >
          {/* The listed projects, and an unlisted one only when the visitor's link asked for it. */}
          {UPCOMING.filter((p) => isListed(p) || p.slug === arrivedFor).map((p) => {
            const checked = projects.includes(p.slug)
            return (
              <label
                key={p.slug}
                style={{ '--accent': p.accent } as CSSProperties}
                className={`group relative flex cursor-pointer items-center rounded-xl border ${modal ? 'gap-2.5 px-3 py-2 sm:odd:last:col-span-2' : 'gap-3 px-4 py-3 sm:odd:last:col-span-2'} ${side ? 'lg:gap-2.5 lg:px-3 lg:py-2 lg:odd:last:col-span-1 xl:odd:last:col-span-2' : ''} transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--accent) ${
                  checked ? 'border-(--accent)/60 bg-(--accent)/10' : 'border-slate-600 bg-slate-800/60 hover:border-slate-500'
                }`}
              >
                <input
                  type="checkbox"
                  name="projects"
                  value={p.slug}
                  checked={checked}
                  onChange={() => toggle(p.slug)}
                  disabled={busy}
                  className="peer sr-only"
                />
                <Image
                  src={p.icon}
                  alt=""
                  width={32}
                  height={32}
                  className={`shrink-0 rounded-lg ring-1 ring-white/10 ${modal ? 'h-7 w-7' : 'h-8 w-8'} ${side ? 'lg:h-7 lg:w-7' : ''}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-100">{p.name}</span>
                  {!modal && (
                    <span className={`block text-xs text-pretty text-slate-400 ${side ? 'lg:hidden' : ''}`}>{p.tagline}</span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    checked ? 'border-(--accent) bg-(--accent) text-slate-950' : 'border-slate-500 text-transparent'
                  }`}
                >
                  <FiCheck className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </label>
            )
          })}
        </div>
        {errors.projects && (
          <p id={errorId('waitlist-projects')} className="mt-2 text-sm text-red-400">
            {errors.projects}
          </p>
        )}
      </fieldset>

      {state.kind === 'error' && (
        <p
          id="waitlist-error"
          role="alert"
          className="fade-in rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm leading-relaxed text-red-200"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        {/* Invisible unless Cloudflare needs a challenge; see the contact form. */}
        {turnstile.widget}
        <button
          type="submit"
          disabled={!hydrated || busy}
          className={`relative inline-flex h-12 w-full shrink-0 overflow-hidden rounded-lg p-px focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-60 ${side ? 'lg:h-11 lg:w-full' : ''} ${
            busy ? 'cursor-not-allowed opacity-75' : ''
          }`}
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A5F3FC_0%,#2563EB_50%,#A5F3FC_100%)] motion-reduce:animate-none" />
          <span className="pointer-events-none relative inline-flex h-full w-full items-center justify-center rounded-lg bg-slate-950 px-7 text-sm font-medium whitespace-nowrap text-white">
            {busy ? 'Joining...' : 'Join the waitlist'}
          </span>
        </button>
        <p className={`text-center text-sm text-balance text-slate-400 ${side ? 'lg:text-xs lg:leading-relaxed' : ''}`}>
          An email when there is something to try. No newsletter, and you can leave any time.{' '}
          <Link href="/privacy#waitlist" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
            How sign-ups are kept
          </Link>
        </p>
      </div>
    </form>
  )
}
