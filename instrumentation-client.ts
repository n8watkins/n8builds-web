// Sentry — browser/client init. Inert until NEXT_PUBLIC_SENTRY_DSN is set
// (no DSN = disabled, no network calls). Config per skills.sentry.dev/sentry-nextjs-sdk.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  // NOTE: sends user IP + request headers to Sentry, and Session Replay records
  // sessions (text masked by default). Disclose this in the privacy policy, or
  // set sendDefaultPii:false / drop the replay integration if you'd rather not.
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  integrations: [Sentry.replayIntegration()],
})

// Capture App Router client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
