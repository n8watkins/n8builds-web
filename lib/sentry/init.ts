// The browser Sentry SDK and its configuration, loaded lazily by lib/sentry/lazy.ts
// (never import this module statically from client code).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Same-origin tunnel (app/monitoring/route.ts), so ad blockers and the CSP
  // let events through.
  tunnel: '/monitoring',
  // NOTE: sends user IP + request headers to Sentry, and Session Replay records
  // sessions (text masked by default). Disclose this in the privacy policy, or
  // set sendDefaultPii:false / drop the replay integration if you'd rather not.
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
})

// Session Replay is a further chunk of its own, added once the SDK is up.
import('@sentry/replay')
  .then(({ replayIntegration }) => Sentry.addIntegration(replayIntegration()))
  .catch(() => {
    // Offline or blocked: errors are still reported, just without a replay.
  })

export { Sentry }
