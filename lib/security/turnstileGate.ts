/** How long a send waits for Turnstile to issue a token before explaining the failure. */
export const TURNSTILE_WAIT_MS = 15_000

/** Sent instead of a token where no widget runs (`next dev`): the server skips Turnstile there and rejects it everywhere else. */
export const DEV_BYPASS_TOKEN = 'dev_bypass_token'

/** What the gate drives: a rendered Turnstile widget in `execution: 'execute'` mode. */
export interface TurnstileWidget {
  execute: () => void
  reset: () => void
}

/**
 * When to run a form's Turnstile challenge, and the token it issues
 * (hooks/useTurnstileOnIntent.tsx renders the widget and wires the events).
 *
 * A challenge runs only when asked for (`request`: the visitor's first focus or
 * input, a send, a retry), never on page view or scroll. Tokens are single-use
 * and expire after about 300 s: a spent or expired token is replaced on the next
 * request, not in the background, unless a send is waiting for one.
 */
export class TurnstileGate {
  private widget: TurnstileWidget | null = null
  private token = ''
  // A challenge is running; its token (or an error) is on its way.
  private running = false
  // The widget has run before: it must be reset to run again.
  private used = false
  // A token was asked for before the widget had rendered.
  private wanted = false
  private waiters = new Set<(token: string | null) => void>()

  constructor(
    private readonly enabled: boolean,
    private readonly hooks: { mount: () => void; onToken?: () => void },
    private readonly waitMs = TURNSTILE_WAIT_MS
  ) {}

  /** Ask for a token, if none is ready or on its way; mounts the widget the first time. */
  request = () => {
    if (!this.enabled || this.token || this.running) return
    this.wanted = true
    if (!this.widget) return this.hooks.mount()
    this.run()
  }

  /** True when a send needs no wait. */
  hasToken = () => !this.enabled || Boolean(this.token)

  /** Resolve with a token, asking for one if needed; null when none comes within the wait. */
  getToken = (): Promise<string | null> => {
    if (!this.enabled) return Promise.resolve(DEV_BYPASS_TOKEN)
    if (this.token) return Promise.resolve(this.token)
    return new Promise((resolve) => {
      const waiter = (value: string | null) => {
        clearTimeout(timer)
        this.waiters.delete(waiter)
        resolve(value)
      }
      const timer = setTimeout(() => waiter(null), this.waitMs)
      this.waiters.add(waiter)
      this.request()
    })
  }

  /** The token was sent: the next send needs a new one. */
  spend = () => {
    this.token = ''
    this.used = true
  }

  /** The widget has rendered (again, after its form re-rendered): run it if a token is wanted. */
  loaded = (widget: TurnstileWidget) => {
    this.widget = widget
    this.running = false
    this.used = false
    if (this.wanted) this.run()
  }

  /** The widget left the page. */
  unloaded = () => {
    this.widget = null
    this.running = false
  }

  succeeded = (token: string) => {
    this.running = false
    this.used = true
    this.token = token
    this.hooks.onToken?.()
    for (const waiter of [...this.waiters]) waiter(token)
  }

  expired = () => {
    this.running = false
    this.used = true
    this.token = ''
    // A send is waiting: get a new one now. Otherwise the next request will.
    if (this.waiters.size > 0) this.request()
  }

  /** Turnstile retries on its own; a waiting send gives up after the wait, and the next request starts afresh. */
  failed = () => {
    this.running = false
    this.used = true
  }

  private run() {
    const widget = this.widget
    if (!widget) return
    this.wanted = false
    this.running = true
    if (this.used) {
      this.used = false
      widget.reset()
    }
    widget.execute()
  }
}
