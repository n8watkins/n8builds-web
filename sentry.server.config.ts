// Sentry — server runtime init. Inert until NEXT_PUBLIC_SENTRY_DSN is set
// (no DSN = disabled, zero network calls), so this is safe to ship before the
// project/DSN exists.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  // Errors are the priority; a little tracing for context. Set to 0 to disable
  // performance monitoring, or 1 to capture everything.
  tracesSampleRate: 0.1,
  // Don't attach PII (IPs, headers) — keeps it aligned with the privacy policy.
  sendDefaultPii: false,
})
