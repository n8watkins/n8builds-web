'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiCheckCircle } from 'react-icons/fi'
import { ContactInput } from '@/components/ui/ContactInput'
import { useHydrated } from '@/hooks/useHydrated'
import { useTurnstileOnIntent } from '@/hooks/useTurnstileOnIntent'

const DIRECT_EMAIL = 'contact@n8builds.dev'
const FALLBACK_ERROR = `Something went wrong. Please try again, or email me at ${DIRECT_EMAIL}.`
const VERIFY_ERROR = `We couldn't verify your browser (an ad or privacy blocker can cause this). Please refresh and try again, or email me at ${DIRECT_EMAIL}.`

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; token: string }
  | { kind: 'no-token' }
  | { kind: 'sending' }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string }

const COPY = {
  confirm: {
    button: 'Confirm my spot',
    sending: 'Confirming...',
    lead: 'One click and you are on the list. I will email you when there is something to try.',
    noToken: 'This page needs the link from your confirmation email. Open it from the email again, or join on the upcoming page.',
  },
  leave: {
    button: 'Remove me from the waitlist',
    sending: 'Removing...',
    lead: 'This deletes your address and everything stored with it. You can always join again later.',
    noToken: '',
  },
} as const

async function post(url: string, body: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { ok: response.ok, data: await response.json().catch(() => ({})) }
}

/**
 * The confirm and leave links' pages. Each acts only on a button press, never
 * on load: mail scanners open every link in a message, and must neither
 * confirm a sign-up nor remove one. The token comes from `?t=`. Without one,
 * the leave page asks for the address and emails a link instead.
 */
export default function WaitlistLinkAction({ mode, turnstileSiteKey }: { mode: 'confirm' | 'leave'; turnstileSiteKey: string }) {
  const hydrated = useHydrated()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const copy = COPY[mode]

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('t')
    // Read once from the address bar on arrival.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(token ? { kind: 'ready', token } : { kind: 'no-token' })
    // Keep the secret out of the history entry, and of any address shared from here.
    if (token) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const act = async (token: string) => {
    setState({ kind: 'sending' })
    try {
      const { ok, data } = await post(`/api/waitlist/${mode}`, { token })
      if (ok) {
        const projects = typeof data.projects === 'string' && data.projects ? data.projects : 'the waitlist'
        return setState({
          kind: 'done',
          message:
            mode === 'confirm'
              ? `You're on the list for ${projects}. I'll email you when there is something to try.`
              : 'Done: your address and everything stored with it are deleted.',
        })
      }
      setState({ kind: 'error', message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR })
    } catch {
      setState({ kind: 'error', message: FALLBACK_ERROR })
    }
  }

  if (state.kind === 'loading') return <div className="h-12" aria-hidden />

  if (state.kind === 'done') {
    return (
      <div role="status" className="fade-in flex items-start gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/8 p-4">
        <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
        <p className="text-slate-100">{state.message}</p>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-4">
        <p
          role="alert"
          className="fade-in rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm leading-relaxed text-red-200"
        >
          {state.message}
        </p>
        <Link href="/upcoming" className="inline-block text-sm text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
          Back to the upcoming projects
        </Link>
      </div>
    )
  }

  if (state.kind === 'no-token') {
    if (mode === 'leave') return <LeaveByEmail turnstileSiteKey={turnstileSiteKey} />
    return (
      <p className="leading-relaxed text-slate-300">
        {copy.noToken}{' '}
        <Link href="/upcoming#waitlist" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
          Go to the waitlist
        </Link>
      </p>
    )
  }

  const busy = state.kind === 'sending'
  return (
    <div className="space-y-5">
      <p className="leading-relaxed text-slate-300">{copy.lead}</p>
      <button
        type="button"
        disabled={!hydrated || busy}
        onClick={() => state.kind === 'ready' && act(state.token)}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-linear-to-r from-cyan-600 to-blue-700 px-6 text-sm font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-75"
      >
        {busy ? copy.sending : copy.button}
      </button>
    </div>
  )
}

/** For someone without a link: emails one to the address, if it is on the list. */
function LeaveByEmail({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const hydrated = useHydrated()
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  // Turnstile runs on the first focus or input in the form (useTurnstileOnIntent).
  const turnstile = useTurnstileOnIntent(turnstileSiteKey)
  const [state, setState] = useState<{ kind: 'idle' | 'sending' } | { kind: 'done' | 'error'; message: string }>({ kind: 'idle' })

  if (state.kind === 'done') {
    return (
      <div role="status" className="fade-in flex items-start gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/8 p-4">
        <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
        <p className="text-slate-100">{state.message}</p>
      </div>
    )
  }

  const busy = state.kind === 'sending'
  // A send before Turnstile's token is ready waits for it, as on the other forms.
  const ready = hydrated && !busy

  return (
    <form
      {...turnstile.intentProps}
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!ready) return
        setState({ kind: 'sending' })
        const token = await turnstile.getToken()
        if (!token) return setState({ kind: 'error', message: VERIFY_ERROR })
        // Tokens are single-use: this one is spent once sent.
        turnstile.spend()
        try {
          const { ok, data } = await post('/api/waitlist/leave', { email: email.trim(), turnstile: token, honeypot })
          const message =
            typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : FALLBACK_ERROR
          setState({ kind: ok ? 'done' : 'error', message })
          if (ok) return
        } catch {
          setState({ kind: 'error', message: FALLBACK_ERROR })
        }
        // The visitor will likely try again: have a fresh token ready.
        turnstile.prepare()
      }}
    >
      <p className="leading-relaxed text-slate-300">
        Enter the address you signed up with, and I&rsquo;ll email it a link that removes it from the waitlist.
      </p>
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
        id="leave-email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
      />
      {state.kind === 'error' && (
        <p role="alert" className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm leading-relaxed text-red-200">
          {state.message}
        </p>
      )}
      {/* Invisible unless Cloudflare needs a challenge; see the contact form. */}
      {turnstile.widget}
      <button
        type="submit"
        disabled={!ready}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-linear-to-r from-cyan-600 to-blue-700 px-6 text-sm font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-75"
      >
        {busy ? 'Sending...' : 'Email me a link'}
      </button>
    </form>
  )
}
