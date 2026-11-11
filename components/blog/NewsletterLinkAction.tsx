'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiCheckCircle } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'

const FALLBACK_ERROR = 'Something went wrong. Please try again, or email me at contact@n8builds.dev.'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; token: string }
  | { kind: 'no-token' }
  | { kind: 'sending' }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string }

const COPY = {
  confirm: {
    lead: 'One click and you are subscribed: one short email in any week with a new post, and nothing else.',
    button: 'Confirm my subscription',
    sending: 'Confirming...',
    done: "You're subscribed. The next email comes in a week with a new post.",
  },
  unsubscribe: {
    lead: 'This deletes your address from the newsletter. You can always sign up again on the blog.',
    button: 'Unsubscribe',
    sending: 'Unsubscribing...',
    done: "You're unsubscribed, and your address is deleted.",
  },
} as const

/**
 * The newsletter's confirm and unsubscribe pages. Each acts only on a button
 * press, never on load: mail scanners open every link in a message, and must
 * neither confirm a sign-up nor remove one. (Mail clients' own one-click
 * unsubscribe POSTs to the API directly.) The token comes from `?t=`.
 */
export default function NewsletterLinkAction({ mode }: { mode: 'confirm' | 'unsubscribe' }) {
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
      const response = await fetch(`/api/newsletter/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: unknown }
      if (response.ok) return setState({ kind: 'done', message: copy.done })
      setState({ kind: 'error', message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR })
    } catch {
      setState({ kind: 'error', message: FALLBACK_ERROR })
    }
  }

  if (state.kind === 'loading') return <div className="h-12" aria-hidden />

  if (state.kind === 'done') {
    return (
      <div className="space-y-5">
        <div role="status" className="fade-in flex items-start gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/8 p-4">
          <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
          <p className="text-slate-100">{state.message}</p>
        </div>
        <BackToBlog />
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-4">
        <p role="alert" className="fade-in rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm leading-relaxed text-red-200">
          {state.message}
        </p>
        <BackToBlog />
      </div>
    )
  }

  if (state.kind === 'no-token') {
    return (
      <p className="leading-relaxed text-slate-300">
        This page needs the link from your email. Open it from the email again, or go to{' '}
        <Link href="/blog" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
          the blog
        </Link>
        .
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

function BackToBlog() {
  return (
    <Link href="/blog" className="inline-block text-sm text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
      Back to N8&apos;s Notions
    </Link>
  )
}
