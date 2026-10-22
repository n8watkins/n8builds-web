import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Sentry beforeSend hook: drop the request body of contact-form submissions.
 * With sendDefaultPii the server SDK attaches request data to events, and a
 * contact submission is a visitor's name, email and message.
 */
export function scrubContactBody(event: ErrorEvent): ErrorEvent {
  if (event.request?.url?.includes('/api/contact')) {
    delete event.request.data
    delete event.request.cookies
  }
  return event
}
