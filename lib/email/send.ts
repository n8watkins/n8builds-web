import { getCloudflareContext } from '@opennextjs/cloudflare'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { EMAIL_ICONS } from '@/lib/email/icons'
import { recordTestEmail } from '@/lib/email/outbox'
import { isContactTestMode } from '@/lib/security/testMode'
import { logger } from '@/lib/logger'

/**
 * Every email the site sends (contact notifications and auto-replies, quote
 * requests, waitlist links) goes through the shared mailroom Worker
 * (n8watkins/mailroom) over the `MAILROOM` service binding in wrangler.jsonc,
 * as the app `n8builds-web`, from contact@n8builds.dev. mailroom counts every
 * send against this app's caps and the account-wide monthly cap, so the
 * account never sends past the emails Workers Paid includes. A send it
 * refuses (a cap, the rate limit, a suppressed address) is a failure here and
 * is never retried.
 */

export type EmailImage = keyof typeof EMAIL_ICONS

/** The kinds mailroom allows the n8builds-web app to send. */
export type EmailKind = 'contact-notice' | 'contact-reply' | 'quote-notice' | 'quote-reply' | 'waitlist'

export interface Email {
  kind: EmailKind
  to: string
  replyTo: string
  subject: string
  html: string
  text: string
  /** Icons sent as inline attachments, referenced in the HTML as `cid:icon-<name>`. */
  images: EmailImage[]
  /** Allowlisted headers, such as List-Unsubscribe and List-Unsubscribe-Post. */
  headers?: Record<string, string>
}

type MailroomResult =
  | { ok: true; messageId: string; duplicate?: boolean }
  | { ok: false; code: string; retryable: boolean; message: string }

/** The part of mailroom's `Mailroom` entrypoint this file uses (its src/types.ts). */
interface MailroomBinding {
  send(request: {
    kind: EmailKind
    to: string
    subject: string
    text: string
    html: string
    fromName: string
    replyTo: string
    headers?: Record<string, string>
    attachments: {
      content: ArrayBuffer
      filename: string
      type: string
      disposition: 'inline'
      contentId: string
    }[]
    key: string
  }): Promise<MailroomResult>
}

/** mailroom refused the send (`code`: cap_app_day, rate_limited, suppressed, ...). */
export class EmailRefusedError extends Error {
  constructor(readonly code: string) {
    super(`mailroom refused the email: ${code}`)
    this.name = 'EmailRefusedError'
  }
}

function binding(): MailroomBinding {
  let mailroom: MailroomBinding | undefined
  try {
    mailroom = (getCloudflareContext().env as { MAILROOM?: MailroomBinding }).MAILROOM
  } catch {
    // Not running on Workers (next dev, next start).
  }
  if (!mailroom) {
    throw new Error('The MAILROOM binding is missing: email sends only on Cloudflare (or set CONTACT_TEST_MODE=1)')
  }
  return mailroom
}

function icon(name: EmailImage) {
  const bytes = Uint8Array.from(atob(EMAIL_ICONS[name]), (c) => c.charCodeAt(0))
  return {
    content: bytes.buffer,
    filename: `${name}.png`,
    type: 'image/png',
    disposition: 'inline' as const,
    contentId: `icon-${name}`,
  }
}

/**
 * Sends one email and returns its message ID; throws when it can't be sent,
 * including when mailroom refuses it (EmailRefusedError). Never retries.
 */
export async function sendEmail(email: Email): Promise<string> {
  // Test runs send nothing: the message waits in the test outbox instead.
  if (isContactTestMode()) {
    recordTestEmail({ to: email.to, subject: email.subject, text: email.text, headers: email.headers })
    return `test-${crypto.randomUUID()}`
  }

  const result = await binding().send({
    kind: email.kind,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    fromName: EMAIL_CONFIG.fromName,
    replyTo: email.replyTo,
    ...(email.headers ? { headers: email.headers } : {}),
    attachments: email.images.map(icon),
    // One key per message: the same message never goes out twice.
    key: `${email.kind}-${crypto.randomUUID()}`,
  })
  if (!result.ok) {
    logger.warn(`mailroom refused a ${email.kind} email: ${result.code}`)
    throw new EmailRefusedError(result.code)
  }
  logger.info('   Message ID:', result.messageId)
  return result.messageId
}
