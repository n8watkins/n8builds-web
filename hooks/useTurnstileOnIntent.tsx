'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { TurnstileGate } from '@/lib/security/turnstileGate'

export interface TurnstileOnIntent {
  /** Spread on the <form>: the first focus or input in any of its fields asks Turnstile for a token. */
  intentProps: { onFocus: () => void; onInput: () => void }
  /** Ask for a token now, if none is ready or on its way (a pick from elsewhere, a retry after a failed send). */
  prepare: () => void
  /** Resolve with a token, asking for one if needed; null when none comes in time. */
  getToken: () => Promise<string | null>
  /** True when a token is ready, so a send needs no wait. */
  hasToken: () => boolean
  /** The token was sent: tokens are single-use, so the next send needs a new one. */
  spend: () => void
  /** The invisible widget, to render inside the form (null until the first intent, and without a site key). */
  widget: ReactNode
}

/**
 * Cloudflare Turnstile run only when a visitor shows intent to use a form, as on
 * every form with Turnstile (contact, quote, waitlist, leaving the waitlist).
 *
 * Nothing loads with the page or on scroll: the first focus or input in a field
 * mounts the widget (which injects Cloudflare's script) and executes the challenge
 * (`execution: 'execute'`). By the time the visitor has typed and pressed Send the
 * token is almost always ready; if not, the send waits for it. Until 2026-11-10 the
 * widget ran when a form came near the screen, so most tokens were issued for page
 * views and never sent, and Cloudflare warned that siteverify wasn't being called.
 * lib/security/turnstileGate.ts decides when to run and keeps the token.
 */
export function useTurnstileOnIntent(
  siteKey: string,
  /** `onToken` (each token issued, for analytics) is read on the first render only. */
  { onToken }: { onToken?: () => void } = {}
): TurnstileOnIntent {
  const [armed, setArmed] = useState(false)
  const [gate] = useState(() => new TurnstileGate(Boolean(siteKey), { mount: () => setArmed(true), onToken }))
  const instance = useRef<TurnstileInstance | null>(null)
  const id = `turnstile-${useId().replace(/[^\w-]/g, '')}`

  const widget =
    siteKey && armed ? (
      <WidgetLifetime onUnmount={gate.unloaded}>
        <Turnstile
          ref={instance}
          id={id}
          siteKey={siteKey}
          onWidgetLoad={() =>
            gate.loaded({ execute: () => instance.current?.execute(), reset: () => instance.current?.reset() })
          }
          onSuccess={gate.succeeded}
          onExpire={gate.expired}
          onError={gate.failed}
          // Invisible (the widget's mode in the Cloudflare dashboard), shown only if
          // Cloudflare ever needs the visitor to interact. 'never': an expired token is
          // replaced on the next intent, not in the background.
          options={{ execution: 'execute', appearance: 'interaction-only', refreshExpired: 'never' }}
          className="absolute"
        />
      </WidgetLifetime>
    ) : null

  return {
    intentProps: { onFocus: gate.request, onInput: gate.request },
    prepare: gate.request,
    getToken: gate.getToken,
    hasToken: gate.hasToken,
    spend: gate.spend,
    widget,
  }
}

/** Tells the gate when the widget leaves the page (its form re-renders as a sending or success screen). */
function WidgetLifetime({ onUnmount, children }: { onUnmount: () => void; children: ReactNode }) {
  useEffect(() => onUnmount, [onUnmount])
  return children
}
