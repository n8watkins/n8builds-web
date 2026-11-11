import { createHash, randomBytes } from 'node:crypto'
import { isUpcomingSlug, type UpcomingSlug } from '@/data/upcoming'
import { waitlistDb, type D1Database } from '@/lib/db'

/**
 * Where waitlist sign-ups live: the n8builds-waitlist D1 database
 * (docs/DATABASE.md has the tables, retention and threats). Unlike the
 * anonymous counters, these hold what a visitor typed: their email, projects
 * and note, kept until they leave.
 *
 * Every write is one statement or one batch (a transaction), so a double
 * click, a replayed link or two joins at once can't leave a half-done entry.
 * Link tokens are stored as SHA-256 hashes only; a confirm link works once.
 */

export const PENDING_DAYS = 7
export const LEAVE_LINK_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

export type WaitlistEntry = {
  id: string
  email: string
  /** Confirmed projects. */
  projects: UpcomingSlug[]
  /** Projects asked for since, waiting on the confirm link. */
  requested: UpcomingSlug[]
  note: string
  requestedNote: string
  createdAt: string
  updatedAt: string
  confirmedAt: string
  /** First touch: the `interest` the visitor arrived with, and the page that sent them. */
  interest: string
  referrer: string
}

/** The secrets behind one email's links (only their hashes are stored). */
export type WaitlistLinks = { confirm: string; leave: string }

export type JoinRequest = {
  /** Already normalized (normalizeEmail) and validated (joinSchema). */
  email: string
  projects: UpcomingSlug[]
  note: string
  interest: string
  referrer: string
}

export const entryId = (normalizedEmail: string) => createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 32)

export const newToken = () => randomBytes(24).toString('base64url')

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

type SubscriberRow = {
  id: string
  email: string
  note: string
  requested_note: string
  interest: string
  referrer: string
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

type ProjectRow = { project: string; status: 'requested' | 'confirmed' }

function toEntry(row: SubscriberRow, projects: ProjectRow[]): WaitlistEntry {
  const slugs = (status: ProjectRow['status']) =>
    projects.filter((p) => p.status === status && isUpcomingSlug(p.project)).map((p) => p.project as UpcomingSlug)
  return {
    id: row.id,
    email: row.email,
    projects: slugs('confirmed'),
    requested: slugs('requested'),
    note: row.note,
    requestedNote: row.requested_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at ?? '',
    interest: row.interest,
    referrer: row.referrer,
  }
}

// A row past its expiry is gone as far as every query is concerned; the
// daily cleanup (lib/retention.ts) deletes it later.
const LIVE = '(expires_at IS NULL OR expires_at > ?)'

export class WaitlistStore {
  constructor(
    private readonly db: D1Database,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** The live entry for an id, or null (unknown, or unconfirmed and expired). */
  async get(id: string): Promise<WaitlistEntry | null> {
    const at = this.now().getTime()
    const [subscriber, projects] = await this.db.batch([
      this.db.prepare(`SELECT * FROM waitlist_subscribers WHERE id = ? AND ${LIVE}`).bind(id, at),
      this.db.prepare('SELECT project, status FROM waitlist_projects WHERE subscriber_id = ? ORDER BY requested_at, project').bind(id),
    ])
    const row = subscriber.results[0] as SubscriberRow | undefined
    return row ? toEntry(row, projects.results as ProjectRow[]) : null
  }

  /**
   * Adds the projects (and note) to the address's request, waiting on the
   * confirm link; creates the entry if it is new. Never changes what an
   * address is confirmed for. One transaction.
   */
  async join(request: JoinRequest): Promise<WaitlistEntry> {
    const now = this.now()
    const at = now.getTime()
    const iso = now.toISOString()
    const id = entryId(request.email)
    await this.db.batch([
      // An unconfirmed entry that expired but isn't purged yet starts over.
      this.db.prepare('DELETE FROM waitlist_subscribers WHERE id = ? AND expires_at IS NOT NULL AND expires_at <= ?').bind(id, at),
      this.db
        .prepare(
          `INSERT INTO waitlist_subscribers
             (id, email, note, requested_note, interest, referrer, created_at, updated_at, confirmed_at, expires_at)
           VALUES (?, ?, '', ?, ?, ?, ?, ?, NULL, ?)
           ON CONFLICT (id) DO UPDATE SET
             requested_note = CASE WHEN excluded.requested_note <> '' THEN excluded.requested_note ELSE requested_note END,
             updated_at = excluded.updated_at,
             expires_at = CASE WHEN confirmed_at IS NULL THEN excluded.expires_at ELSE NULL END`
        )
        .bind(id, request.email, request.note, request.interest, request.referrer, iso, iso, at + PENDING_DAYS * DAY_MS),
      ...request.projects.map((project) =>
        this.db
          .prepare(
            `INSERT INTO waitlist_projects (subscriber_id, project, status, requested_at)
             VALUES (?, ?, 'requested', ?) ON CONFLICT (subscriber_id, project) DO NOTHING`
          )
          .bind(id, project, iso)
      ),
    ])
    const entry = await this.get(id)
    if (!entry) throw new Error('waitlist entry missing right after it was written')
    return entry
  }

  /** New confirm and leave links for an email about to be sent. */
  async issueLinks(entry: WaitlistEntry): Promise<WaitlistLinks> {
    const links = { confirm: newToken(), leave: newToken() }
    const at = this.now().getTime()
    const insert = 'INSERT INTO waitlist_tokens (token_hash, subscriber_id, purpose, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
    await this.db.batch([
      this.db.prepare(insert).bind(tokenHash(links.confirm), entry.id, 'confirm', at, at + PENDING_DAYS * DAY_MS),
      this.db.prepare(insert).bind(tokenHash(links.leave), entry.id, 'leave', at, at + LEAVE_LINK_DAYS * DAY_MS),
    ])
    return links
  }

  /** A new leave link, for the "email me a link" form. */
  async issueLeaveLink(entry: WaitlistEntry): Promise<string> {
    const token = newToken()
    const at = this.now().getTime()
    await this.db
      .prepare("INSERT INTO waitlist_tokens (token_hash, subscriber_id, purpose, created_at, expires_at) VALUES (?, ?, 'leave', ?, ?)")
      .bind(tokenHash(token), entry.id, at, at + LEAVE_LINK_DAYS * DAY_MS)
      .run()
    return token
  }

  /**
   * Uses a confirm link: everything the address asked for becomes confirmed.
   * Null when the link is unknown, expired or already used. One transaction:
   * the token is spent by the first statement, and the others only act for
   * the token that statement spent.
   */
  async confirm(token: string): Promise<WaitlistEntry | null> {
    const now = this.now()
    const at = now.getTime()
    const iso = now.toISOString()
    const hash = tokenHash(token)
    const spent = 'SELECT subscriber_id FROM waitlist_tokens WHERE token_hash = ? AND used_at = ?'
    const [use] = await this.db.batch([
      this.db
        .prepare("UPDATE waitlist_tokens SET used_at = ? WHERE token_hash = ? AND purpose = 'confirm' AND used_at IS NULL AND expires_at > ?")
        .bind(at, hash, at),
      this.db
        .prepare(`UPDATE waitlist_projects SET status = 'confirmed', confirmed_at = ? WHERE status = 'requested' AND subscriber_id = (${spent})`)
        .bind(iso, hash, at),
      this.db
        .prepare(
          `UPDATE waitlist_subscribers SET
             note = CASE WHEN requested_note <> '' THEN requested_note ELSE note END,
             requested_note = '',
             confirmed_at = COALESCE(confirmed_at, ?),
             updated_at = ?,
             expires_at = NULL
           WHERE id = (${spent}) AND ${LIVE}`
        )
        .bind(iso, iso, hash, at, at),
    ])
    if (use.meta.changes === 0) return null
    const row = await this.db.prepare('SELECT subscriber_id FROM waitlist_tokens WHERE token_hash = ?').bind(hash).first<{ subscriber_id: string }>()
    return row ? this.get(row.subscriber_id) : null
  }

  /** Uses a leave link: deletes the entry and everything with it. False when there was nothing to delete. */
  async leave(token: string): Promise<boolean> {
    const at = this.now().getTime()
    const { meta } = await this.db
      .prepare(
        "DELETE FROM waitlist_subscribers WHERE id = (SELECT subscriber_id FROM waitlist_tokens WHERE token_hash = ? AND purpose = 'leave' AND expires_at > ?)"
      )
      .bind(tokenHash(token), at)
      .run()
    return meta.changes > 0
  }

  /** The live entry behind a leave link (for the manage page), or null when it is unknown or expired. */
  async forLeaveToken(token: string): Promise<WaitlistEntry | null> {
    const row = await this.db
      .prepare("SELECT subscriber_id FROM waitlist_tokens WHERE token_hash = ? AND purpose = 'leave' AND expires_at > ?")
      .bind(tokenHash(token), this.now().getTime())
      .first<{ subscriber_id: string }>()
    return row ? this.get(row.subscriber_id) : null
  }

  /**
   * Uses a leave link to stay on only some projects: every other project of
   * the entry is removed. Keeping none deletes the entry, as leaving does.
   * Null when the link is unknown or expired, or the entry is gone; else what
   * is left. One transaction, and the link keeps working until it expires.
   */
  async keepOnly(token: string, keep: UpcomingSlug[]): Promise<WaitlistEntry | null> {
    const entry = await this.forLeaveToken(token)
    if (!entry) return null
    if (keep.length === 0) {
      await this.leave(token)
      return null
    }
    const marks = keep.map(() => '?').join(', ')
    await this.db.batch([
      this.db.prepare(`DELETE FROM waitlist_projects WHERE subscriber_id = ? AND project NOT IN (${marks})`).bind(entry.id, ...keep),
      // Nothing left (it kept only projects it wasn't on): gone, as leaving.
      this.db
        .prepare('DELETE FROM waitlist_subscribers WHERE id = ? AND NOT EXISTS (SELECT 1 FROM waitlist_projects WHERE subscriber_id = ?)')
        .bind(entry.id, entry.id),
      this.db.prepare('UPDATE waitlist_subscribers SET updated_at = ? WHERE id = ?').bind(this.now().toISOString(), entry.id),
    ])
    return this.get(entry.id)
  }

  /** Deletes an entry by id (a deletion request, from the admin). */
  async remove(id: string): Promise<boolean> {
    const { meta } = await this.db.prepare('DELETE FROM waitlist_subscribers WHERE id = ?').bind(id).run()
    return meta.changes > 0
  }
}

/**
 * The waitlist's store, or null while there is no database (the page then
 * says the waitlist opens soon).
 */
export async function waitlistStore(): Promise<WaitlistStore | null> {
  const db = await waitlistDb()
  return db ? new WaitlistStore(db) : null
}

/** Whether sign-ups can be stored at all; decides between the form and "opens soon". */
export async function isWaitlistOpen(): Promise<boolean> {
  return (await waitlistDb()) !== null
}
