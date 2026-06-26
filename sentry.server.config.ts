// Sentry — server (Node) runtime init. Inert until a DSN is set. Config per
// skills.sentry.dev/sentry-nextjs-sdk. Accepts either SENTRY_DSN or the public one.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  includeLocalVariables: true,
  enableLogs: true,
})
