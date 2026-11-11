import { createDigestHtml, createDigestText, digestSubject, unsubscribeHeaders, type DigestPost } from '@/lib/newsletter/emails'
import type { NewsMailer } from '@/lib/newsletter/mail'
import type { PostSource } from '@/lib/newsletter/posts'
import type { NewsletterStore } from '@/lib/newsletter/store'

/**
 * The weekly digest (worker/index.js runs it from the Cron Triggers).
 *
 * - The weekly run starts a digest only when a post was published since the
 *   last one went out; otherwise it sends nothing.
 * - It goes to the addresses confirmed when it started, in small batches,
 *   and records each delivery, so a run that stops resumes where it left off.
 * - It stops at the first refusal from mailroom (a cap, the rate limit, an
 *   outage) and never retries past it: the next run, the daily one included,
 *   picks it up again. An address mailroom has suppressed (a bounce or a
 *   complaint) is deleted instead, so it can't hold the digest up.
 * - It keeps inside the newsletter's slice in mailroom (n8builds-news: 150 a
 *   month, 40 a day): when this week's digest would take the month's digests
 *   past DIGEST_MONTH_BUDGET, the week is skipped with a note for the owner,
 *   and its posts go out with the next digest that fits.
 */

/** mailroom's monthly cap for n8builds-news (calendar month, UTC). */
export const MONTH_SLICE = 150
/** Kept back from the month's slice for confirm emails. */
export const CONFIRM_RESERVE = 30
export const DIGEST_MONTH_BUDGET = MONTH_SLICE - CONFIRM_RESERVE
/** Digest emails per run, under mailroom's 40 a day, leaving room for that day's confirm emails. */
export const RUN_LIMIT = 30
export const BATCH_SIZE = 10
/** The first digest looks back this far. */
const FIRST_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000

export type DigestDeps = {
  store: NewsletterStore
  mail: NewsMailer
  posts: PostSource
  now?: () => Date
}

export type DigestReport =
  | { action: 'idle' }
  | { action: 'no-posts' }
  | { action: 'no-subscribers' }
  | { action: 'skipped'; digestId: number; note: string }
  | { action: 'sent'; digestId: number; sent: number; removed: number }
  | { action: 'paused'; digestId: number; sent: number; removed: number }
  | { action: 'stopped'; digestId: number; sent: number; removed: number; code: string }

type DigestRow = { id: number; created_at: string; posts: string }
type Recipient = { id: string; email: string; unsubscribe_token: string }

const monthStart = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

/**
 * One cron run. `start` is true on the weekly run: it may begin a new digest.
 * Every run first finishes a digest that is still sending.
 */
export async function runDigest(deps: DigestDeps, { start }: { start: boolean }): Promise<DigestReport> {
  const { db } = deps.store
  const now = (deps.now ?? (() => new Date()))()

  let digest = await db
    .prepare("SELECT id, created_at, posts FROM newsletter_digests WHERE status = 'sending' ORDER BY id LIMIT 1")
    .first<DigestRow>()

  if (!digest) {
    if (!start) return { action: 'idle' }
    const begun = await begin(deps, now)
    if ('action' in begun) return begun
    digest = begun
  }
  return send(deps, digest)
}

async function begin(deps: DigestDeps, now: Date): Promise<DigestRow | DigestReport> {
  const { db } = deps.store
  const nowIso = now.toISOString()
  const last = await db
    .prepare("SELECT created_at FROM newsletter_digests WHERE status IN ('sending', 'sent') ORDER BY id DESC LIMIT 1")
    .first<{ created_at: string }>()
  const since = last?.created_at ?? new Date(now.getTime() - FIRST_LOOKBACK_MS).toISOString()

  const posts = await deps.posts(since, nowIso)
  if (posts.length === 0) return { action: 'no-posts' }

  const recipients = await deps.store.confirmedCount()
  if (recipients === 0) return { action: 'no-subscribers' }

  const used = await db
    .prepare("SELECT COALESCE(SUM(recipients), 0) AS n FROM newsletter_digests WHERE status IN ('sending', 'sent') AND created_at >= ?")
    .bind(monthStart(now))
    .first<{ n: number }>()
  const monthUsed = used?.n ?? 0
  const json = JSON.stringify(posts)

  if (monthUsed + recipients > DIGEST_MONTH_BUDGET) {
    const note = `Skipped: ${recipients} subscribers would take this month's digests to ${monthUsed + recipients}, past the ${DIGEST_MONTH_BUDGET} the newsletter keeps for them (mailroom's n8builds-news slice is ${MONTH_SLICE} a month). The posts go out with the next digest that fits.`
    const row = await db
      .prepare(
        "INSERT INTO newsletter_digests (created_at, posts_since, posts, status, recipients, note, finished_at) VALUES (?, ?, ?, 'skipped', ?, ?, ?) RETURNING id"
      )
      .bind(nowIso, since, json, recipients, note, nowIso)
      .first<{ id: number }>()
    return { action: 'skipped', digestId: row!.id, note }
  }

  const row = await db
    .prepare("INSERT INTO newsletter_digests (created_at, posts_since, posts, status, recipients) VALUES (?, ?, ?, 'sending', ?) RETURNING id")
    .bind(nowIso, since, json, recipients)
    .first<{ id: number }>()
  return { id: row!.id, created_at: nowIso, posts: json }
}

async function send(deps: DigestDeps, digest: DigestRow): Promise<DigestReport> {
  const { db } = deps.store
  const posts = JSON.parse(digest.posts) as DigestPost[]
  const subject = digestSubject(posts)
  let sent = 0
  let removed = 0

  while (sent < RUN_LIMIT) {
    const { results } = await db
      .prepare(
        `SELECT s.id, s.email, s.unsubscribe_token FROM newsletter_subscribers s
         WHERE s.confirmed_at IS NOT NULL AND s.confirmed_at <= ?
           AND NOT EXISTS (SELECT 1 FROM newsletter_deliveries d WHERE d.digest_id = ? AND d.subscriber_id = s.id)
         ORDER BY s.id LIMIT ?`
      )
      .bind(digest.created_at, digest.id, Math.min(BATCH_SIZE, RUN_LIMIT - sent))
      .all<Recipient>()

    if (results.length === 0) {
      await db
        .prepare("UPDATE newsletter_digests SET status = 'sent', finished_at = ?, note = '' WHERE id = ?")
        .bind((deps.now ?? (() => new Date()))().toISOString(), digest.id)
        .run()
      return { action: 'sent', digestId: digest.id, sent, removed }
    }

    for (const recipient of results) {
      let code: string | null = null
      try {
        const result = await deps.mail({
          kind: 'digest',
          to: recipient.email,
          subject,
          text: createDigestText(posts, recipient.unsubscribe_token),
          html: createDigestHtml(posts, recipient.unsubscribe_token),
          headers: unsubscribeHeaders(recipient.unsubscribe_token),
          // The same digest never reaches an address twice, even if recording it below failed.
          key: `digest-${digest.id}-${recipient.id}`,
        })
        if (!result.ok) code = result.code
      } catch (error) {
        code = `error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 200)
      }

      if (code === null) {
        await db
          .prepare('INSERT OR IGNORE INTO newsletter_deliveries (digest_id, subscriber_id, sent_at) VALUES (?, ?, ?)')
          .bind(digest.id, recipient.id, (deps.now ?? (() => new Date()))().toISOString())
          .run()
        sent++
      } else if (code === 'suppressed') {
        await deps.store.remove(recipient.id)
        removed++
      } else {
        await db
          .prepare('UPDATE newsletter_digests SET note = ? WHERE id = ?')
          .bind(`Paused at a refusal from mailroom (${code}); the next run resumes it.`, digest.id)
          .run()
        return { action: 'stopped', digestId: digest.id, sent, removed, code }
      }
    }
  }
  return { action: 'paused', digestId: digest.id, sent, removed }
}
