import { entryId, newToken, tokenHash } from '@/lib/waitlist/store'
import { waitlistDb, type D1Database } from '@/lib/db'

/**
 * The blog newsletter's subscribers, in the n8builds-waitlist D1 database but
 * in their own tables (migrations/waitlist/0002_newsletter.sql), so leaving
 * the newsletter never touches the waitlist and the other way round.
 *
 * - Double opt-in: an address only gets digests once someone clicks the
 *   confirm link sent to it. Until then it expires after CONFIRM_DAYS, and
 *   the daily cleanup deletes it (lib/retention.ts).
 * - A confirm link works once (only its SHA-256 is stored, and it is cleared
 *   when used), and a new sign-up replaces it.
 * - Unsubscribing deletes the row, with no login.
 */

export const CONFIRM_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export type Subscriber = {
  id: string
  email: string
  createdAt: string
  confirmedAt: string
  unsubscribeToken: string
}

/** What a sign-up leads to: a confirm email with this link, or nothing (already subscribed). */
export type SubscribeResult =
  | { status: 'pending'; subscriber: Subscriber; confirmToken: string }
  | { status: 'confirmed'; subscriber: Subscriber }

type Row = {
  id: string
  email: string
  created_at: string
  confirmed_at: string | null
  unsubscribe_token: string
}

const toSubscriber = (row: Row): Subscriber => ({
  id: row.id,
  email: row.email,
  createdAt: row.created_at,
  confirmedAt: row.confirmed_at ?? '',
  unsubscribeToken: row.unsubscribe_token,
})

// Unconfirmed rows past their expiry are gone as far as every query is concerned.
const LIVE = '(expires_at IS NULL OR expires_at > ?)'

export class NewsletterStore {
  constructor(
    readonly db: D1Database,
    private readonly now: () => Date = () => new Date()
  ) {}

  async get(id: string): Promise<Subscriber | null> {
    const row = await this.db
      .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? AND ${LIVE}`)
      .bind(id, this.now().getTime())
      .first<Row>()
    return row ? toSubscriber(row) : null
  }

  /**
   * Signs an address up (already normalized and validated). A new or
   * unconfirmed address gets a fresh confirm link, valid for CONFIRM_DAYS
   * (an older one stops working); a confirmed address is left as it is.
   */
  async subscribe(email: string): Promise<SubscribeResult> {
    const now = this.now()
    const at = now.getTime()
    const id = entryId(email)
    const confirmToken = newToken()
    await this.db.batch([
      // An unconfirmed row that expired but isn't purged yet starts over.
      this.db.prepare('DELETE FROM newsletter_subscribers WHERE id = ? AND expires_at IS NOT NULL AND expires_at <= ?').bind(id, at),
      this.db
        .prepare(
          `INSERT INTO newsletter_subscribers (id, email, created_at, confirmed_at, expires_at, confirm_hash, unsubscribe_token)
           VALUES (?, ?, ?, NULL, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             confirm_hash = excluded.confirm_hash,
             expires_at = excluded.expires_at
           WHERE confirmed_at IS NULL`
        )
        .bind(id, email, now.toISOString(), at + CONFIRM_DAYS * DAY_MS, tokenHash(confirmToken), newToken()),
    ])
    const subscriber = await this.get(id)
    if (!subscriber) throw new Error('newsletter subscriber missing right after it was written')
    return subscriber.confirmedAt ? { status: 'confirmed', subscriber } : { status: 'pending', subscriber, confirmToken }
  }

  /** Uses a confirm link. Null when it is unknown, used, expired, or the address unsubscribed. */
  async confirm(token: string): Promise<Subscriber | null> {
    const now = this.now()
    const hash = tokenHash(token)
    // One statement: the token is spent by the same write that confirms.
    const row = await this.db
      .prepare(
        `UPDATE newsletter_subscribers SET confirmed_at = ?, expires_at = NULL, confirm_hash = NULL
         WHERE confirm_hash = ? AND confirmed_at IS NULL AND expires_at > ?
         RETURNING *`
      )
      .bind(now.toISOString(), hash, now.getTime())
      .first<Row>()
    return row ? toSubscriber(row) : null
  }

  /** Uses an unsubscribe link: deletes the row. False when there was nothing to delete. */
  async unsubscribe(token: string): Promise<boolean> {
    const { meta } = await this.db.prepare('DELETE FROM newsletter_subscribers WHERE unsubscribe_token = ?').bind(token).run()
    return meta.changes > 0
  }

  /** Deletes an address outright (mailroom has it on its suppression list: a bounce or a complaint). */
  async remove(id: string): Promise<boolean> {
    const { meta } = await this.db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').bind(id).run()
    return meta.changes > 0
  }

  /** Confirmed subscribers now. */
  async confirmedCount(): Promise<number> {
    const row = await this.db
      .prepare('SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL')
      .first<{ n: number }>()
    return row?.n ?? 0
  }
}

/** The newsletter's store, or null while there is no database. */
export async function newsletterStore(): Promise<NewsletterStore | null> {
  const db = await waitlistDb()
  return db ? new NewsletterStore(db) : null
}
