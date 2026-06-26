// Sentry — browser/client init. Inert until NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  // No Session Replay — keeps payloads light and well within the free tier.
  sendDefaultPii: false,
})

// Capture App Router client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
