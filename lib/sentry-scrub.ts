import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Sentry beforeSend hook: drop the request body of contact-form submissions.
 * The server SDK attaches incoming request bodies and cookies to events
 * (lib/sentry-data-collection.ts), and a contact submission is a visitor's
 * name, email and message.
 */
export function scrubContactBody(event: ErrorEvent): ErrorEvent {
  if (event.request?.url?.includes('/api/contact')) {
    delete event.request.data
    delete event.request.cookies
  }
  return event
}
