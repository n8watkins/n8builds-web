/**
 * CONTACT_TEST_MODE's outbox: the emails a test run would have sent, kept in
 * this process's memory (the newest 100) so Playwright can follow a link in
 * one (tests/e2e/api/waitlist-flow.spec.ts). Only lib/email/send.ts writes
 * here, and only in test mode; /api/test/outbox reads it, and answers 404
 * outside test mode, which every deployed Worker is (APP_ENV is set).
 */

export type SentEmail = { to: string; subject: string; text: string }

const KEY = Symbol.for('n8builds.testOutbox')
const LIMIT = 100

function outbox(): SentEmail[] {
  const global = globalThis as typeof globalThis & { [KEY]?: SentEmail[] }
  return (global[KEY] ??= [])
}

export function recordTestEmail(email: SentEmail): void {
  const sent = outbox()
  sent.push(email)
  if (sent.length > LIMIT) sent.splice(0, sent.length - LIMIT)
}

/** The emails to one address, oldest first. */
export function testEmailsTo(to: string): SentEmail[] {
  return outbox().filter((email) => email.to === to)
}
