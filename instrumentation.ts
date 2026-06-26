import * as Sentry from '@sentry/nextjs'

// Loads the right Sentry init for each server runtime. Inert until
// NEXT_PUBLIC_SENTRY_DSN is set (see the sentry.*.config.ts files).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Capture errors thrown in server components / route handlers (Next 15+).
export const onRequestError = Sentry.captureRequestError
