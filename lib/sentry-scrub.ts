import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Sentry beforeSend hook: drop the request body of form submissions.
 * The server SDK attaches incoming request bodies and cookies to events
 * (lib/sentry-data-collection.ts), and a contact submission is a visitor's
 * name, email and message; a waitlist request is an email address or a
 * link's secret token.
 */
const PRIVATE_BODIES = ['/api/contact', '/api/waitlist']

export function scrubContactBody(event: ErrorEvent): ErrorEvent {
  const request = event.request
  if (request && PRIVATE_BODIES.some((path) => request.url?.includes(path))) {
    delete request.data
    delete request.cookies
  }
  return event
}
