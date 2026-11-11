import { getCloudflareContext } from '@opennextjs/cloudflare'
import { recordTestEmail } from '@/lib/email/outbox'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * The newsletter's email, through the shared mailroom Worker as its own app,
 * `n8builds-news` (the MAILROOM_NEWS service binding in wrangler.jsonc), from
 * news@n8builds.dev. mailroom caps it at 40 a day, 150 a month and 3 per
 * address a day, separately from the contact form's `n8builds-web`.
 *
 * A refusal comes back as a result, never as a throw: the caller stops on it
 * and never retries past it.
 */

export type NewsKind = 'confirm' | 'digest'

export type NewsEmail = {
  kind: NewsKind
  to: string
  subject: string
  text: string
  html: string
  /** List-Unsubscribe and List-Unsubscribe-Post. */
  headers: Record<string, string>
  /** Idempotency key: the same key never sends twice. */
  key: string
}

export type NewsSendResult = { ok: true } | { ok: false; code: string }

type MailroomResult = { ok: true; messageId: string } | { ok: false; code: string; retryable?: boolean; message?: string }

/** The part of mailroom's `Mailroom` entrypoint the newsletter uses. */
export interface NewsMailroom {
  send(request: {
    kind: NewsKind
    to: string
    subject: string
    text: string
    html: string
    fromName: string
    headers: Record<string, string>
    key: string
  }): Promise<MailroomResult>
}

export type NewsMailer = (email: NewsEmail) => Promise<NewsSendResult>

const FROM_NAME = "N8's Notions"

/**
 * A mailer over a MAILROOM_NEWS binding. In test mode (CONTACT_TEST_MODE)
 * nothing is sent: the message waits in the test outbox. Without a binding,
 * every send is refused (`not_configured`): it fails closed.
 */
export function newsMailer(binding: NewsMailroom | undefined): NewsMailer {
  return async (email) => {
    if (isContactTestMode()) {
      recordTestEmail({ to: email.to, subject: email.subject, text: email.text, headers: email.headers })
      return { ok: true }
    }
    if (!binding) return { ok: false, code: 'not_configured' }
    const result = await binding.send({ ...email, fromName: FROM_NAME })
    return result.ok ? { ok: true } : { ok: false, code: result.code }
  }
}

/** The mailer for a request inside Next (the sign-up route). */
export function requestMailer(): NewsMailer {
  let binding: NewsMailroom | undefined
  try {
    binding = (getCloudflareContext().env as { MAILROOM_NEWS?: NewsMailroom }).MAILROOM_NEWS
  } catch {
    // Not on Workers (next dev, next start): only test mode can send.
  }
  return newsMailer(binding)
}
