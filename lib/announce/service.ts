import { UPCOMING, type UpcomingProject } from '@/data/upcoming'
import type { D1Database } from '@/lib/db'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { leaveHeaders, leaveUrl } from '@/lib/email/waitlist'
import { LEAVE_LINK_DAYS, newToken, tokenHash } from '@/lib/waitlist/store'
import {
  InvalidAnnouncement,
  PLACEHOLDER,
  PREVIEW_MANAGE_URL,
  TEMPLATES,
  findProject,
  isTemplateId,
  renderAnnouncement,
  resolveFields,
  type Fields,
  type TemplateId,
  type TemplateSpec,
} from '@/lib/announce/templates'

/**
 * Announcements: the owner emails the confirmed waitlist people of one
 * project (the admin's Announcements page, over the Announcements entrypoint
 * in worker/index.js). The rules:
 *
 * - One announcement per project every 30 days (a cancelled one that sent
 *   nothing doesn't count).
 * - It goes to the people confirmed on the project when it started (the
 *   snapshot), minus anyone who leaves the project or the waitlist before
 *   their turn.
 * - A cron sends it in small batches through mailroom (kind `announce`,
 *   n8builds-web's slice), each with that person's own manage/leave link and
 *   the idempotency key `announce:<id>:<subscriberId>`. Each send is recorded,
 *   so a resumed run never sends anyone the same announcement twice.
 * - It stops at the first refusal from mailroom (a cap, the rate limit, an
 *   outage) and never retries past it in that run: the announcement waits as
 *   `paused_cap` and the cron resumes it later. An address mailroom has
 *   suppressed (a bounce, a complaint) counts as failed and is passed over.
 * - It keeps inside its share of n8builds-web's slice (60 a day, 200 a month,
 *   shared with the contact form and the waitlist's own emails): at most
 *   DAY_BUDGET announcement emails a UTC day and MONTH_BUDGET a month.
 * - Every start, cancel and test send is written to the audit log with the
 *   owner's login.
 */

export const MIN_DAYS_BETWEEN = 30
/** Announcement emails per UTC day, leaving 20 of n8builds-web's 60 for the contact form and waitlist links. */
export const DAY_BUDGET = 40
/** Announcement emails per calendar month (UTC), leaving 60 of the 200. */
export const MONTH_BUDGET = 140
/** Emails per cron run, and per batch read from the database. */
export const RUN_LIMIT = 20
export const BATCH_SIZE = 10
/** How often the cron runs (wrangler.jsonc triggers): an active announcement's next run. */
export const RUN_EVERY_MINUTES = 15

const DAY_MS = 24 * 60 * 60 * 1000

export type State = 'sending' | 'paused_cap' | 'done' | 'cancelled'

export type AnnouncementStatus = {
  id: string
  project: string
  subject: string
  total: number
  sent: number
  failed: number
  skipped: number
  state: State
  lastError: string | null
  nextRunAt: string | null
  /** Additions to the contract: which template, when and by whom. */
  template: TemplateId
  createdAt: string
  createdBy: string
  finishedAt: string | null
}

export type ProjectSummary = { slug: string; name: string; confirmed: number; lastAnnouncedAt: string | null }

export type AnnounceRequest = { project: string; template: string; fields?: Partial<Fields> }

export type Preview = { subject: string; html: string; text: string; recipients: number; fields: Fields }

export type StartResult = { id: string } | { error: 'too_soon'; nextAllowedAt: string } | { error: 'no_recipients' }

/** mailroom's SendResult (its src/types.ts). */
export type SendResult =
  | { ok: true; messageId: string; duplicate?: boolean }
  | { ok: false; code: string; retryable: boolean; message: string }

/** The part of mailroom's `Mailroom` entrypoint announcements use (the MAILROOM binding, app n8builds-web). */
export interface AnnounceMailroom {
  send(request: {
    kind: 'announce'
    to: string
    subject: string
    text: string
    html: string
    fromName: string
    replyTo: string
    headers: Record<string, string>
    key: string
  }): Promise<SendResult>
}

export type RunReport = { id: string; state: State; sent: number; failed: number; skipped: number; stoppedAt?: string }

type Row = {
  id: string
  project: string
  template: TemplateId
  fields: string
  subject: string
  state: State
  total: number
  sent: number
  failed: number
  skipped: number
  last_error: string | null
  next_run_at: string | null
  created_at: string
  created_by: string
  finished_at: string | null
}

const toStatus = (row: Row): AnnouncementStatus => ({
  id: row.id,
  project: row.project,
  subject: row.subject,
  total: row.total,
  sent: row.sent,
  failed: row.failed,
  skipped: row.skipped,
  state: row.state,
  lastError: row.last_error,
  nextRunAt: row.next_run_at,
  template: row.template,
  createdAt: row.created_at,
  createdBy: row.created_by,
  finishedAt: row.finished_at,
})

/** The announcements that count toward the 30 days: all but a cancelled one that sent nothing. */
const COUNTS = "(state <> 'cancelled' OR sent > 0)"

/** Why an announcement waits when its project is no longer in data/upcoming.ts (or its template is gone). */
const UNKNOWN_PROJECT = 'unknown_project'

/** Refusals that are about one address only: it fails, and the others still get theirs. */
const RECIPIENT_FAILURES = new Set(['suppressed'])

const startOfDay = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
const startOfMonth = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
const nextMonth = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
/** The next cron run after `now`. */
const nextRun = (now: Date) => {
  const step = RUN_EVERY_MINUTES * 60 * 1000
  return new Date(Math.floor(now.getTime() / step) * step + step)
}

/** When to try again after a refusal: a daily or monthly cap waits for the next UTC day, anything else for the next run. */
function retryAfter(code: string, now: Date): Date {
  if (/^(cap_(app|global)_(day|month)|daily_limit|cap_recipient)$/.test(code)) return new Date(startOfDay(now).getTime() + DAY_MS)
  return nextRun(now)
}

function checkActor(actor: unknown): string {
  if (typeof actor !== 'string' || !actor.trim() || actor.length > 100) throw new InvalidAnnouncement('actor is required')
  return actor.trim()
}

function checkId(id: unknown): string {
  if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) throw new InvalidAnnouncement('invalid announcement id')
  return id
}

type Resolved = { project: UpcomingProject; template: TemplateId; fields: Fields }

function resolve(request: AnnounceRequest): Resolved {
  if (!request || typeof request !== 'object') throw new InvalidAnnouncement('missing request')
  const project = findProject(request.project)
  if (!project) throw new InvalidAnnouncement(`unknown project: ${String(request.project)}`)
  if (!isTemplateId(request.template)) throw new InvalidAnnouncement(`unknown template: ${String(request.template)}`)
  return { project, template: request.template, fields: resolveFields(project, request.template, request.fields) }
}

export type AnnounceDeps = {
  db: D1Database
  mailroom: AnnounceMailroom | undefined
  /** Where test sends go: the owner's own address. */
  ownerEmail: string
  now?: () => Date
}

export class Announcements {
  private readonly db: D1Database
  private readonly now: () => Date

  constructor(private readonly deps: AnnounceDeps) {
    this.db = deps.db
    this.now = deps.now ?? (() => new Date())
  }

  /** Every project on /upcoming, with its confirmed people and its last announcement. */
  async projects(): Promise<ProjectSummary[]> {
    const [confirmed, last] = await this.db.batch([
      this.db.prepare(
        `SELECT p.project, COUNT(*) AS n FROM waitlist_projects p JOIN waitlist_subscribers s ON s.id = p.subscriber_id
         WHERE p.status = 'confirmed' AND s.confirmed_at IS NOT NULL GROUP BY p.project`
      ),
      this.db.prepare(`SELECT project, MAX(created_at) AS at FROM waitlist_announcements WHERE ${COUNTS} GROUP BY project`),
    ])
    const counts = new Map((confirmed.results as { project: string; n: number }[]).map((r) => [r.project, r.n]))
    const lasts = new Map((last.results as { project: string; at: string }[]).map((r) => [r.project, r.at]))
    return UPCOMING.map((p) => ({ slug: p.slug, name: p.name, confirmed: counts.get(p.slug) ?? 0, lastAnnouncedAt: lasts.get(p.slug) ?? null }))
  }

  templates(): TemplateSpec[] {
    return TEMPLATES
  }

  /** The email as it would go out, with a placeholder manage link, and how many it would go to now. */
  async preview(request: AnnounceRequest): Promise<Preview> {
    const { project, template, fields } = resolve(request)
    const rendered = renderAnnouncement(project, template, fields, PREVIEW_MANAGE_URL)
    return { ...rendered, recipients: await this.confirmedCount(project.slug), fields }
  }

  /** Sends the email to the owner only, with a placeholder manage link. */
  async sendTest(request: AnnounceRequest, actor: string): Promise<SendResult> {
    const who = checkActor(actor)
    const { project, template, fields } = resolve(request)
    const rendered = renderAnnouncement(project, template, fields, PREVIEW_MANAGE_URL)
    const result = await this.mail({
      to: this.deps.ownerEmail,
      subject: `[Test] ${rendered.subject}`,
      text: rendered.text,
      html: rendered.html,
      headers: {},
      key: `announce-test:${crypto.randomUUID()}`,
    })
    await this.audit(who, 'test', null, project.slug, { template, subject: rendered.subject, result: result.ok ? 'sent' : result.code })
    return result
  }

  /**
   * Starts an announcement: snapshots the project's confirmed people and
   * leaves the sending to the cron (run()). Refused within 30 days of the
   * project's last one, and when no one is confirmed on it.
   */
  async start(request: AnnounceRequest, actor: string): Promise<StartResult> {
    const who = checkActor(actor)
    const { project, template, fields } = resolve(request)
    if (PLACEHOLDER.test(Object.values(fields).join('\n'))) {
      throw new InvalidAnnouncement('Replace the [[...]] placeholder with your own words first')
    }
    const now = this.now()
    const cutoff = new Date(now.getTime() - MIN_DAYS_BETWEEN * DAY_MS).toISOString()
    const tooSoon = await this.tooSoon(project.slug, cutoff)
    if (tooSoon) return tooSoon
    if ((await this.confirmedCount(project.slug)) === 0) return { error: 'no_recipients' }

    const id = crypto.randomUUID().replaceAll('-', '')
    const iso = now.toISOString()
    // One transaction: the 30-day rule is checked again by the insert itself,
    // so two starts at once can't both go out, and the snapshot is taken with it.
    const [created] = await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO waitlist_announcements (id, project, template, fields, subject, state, total, next_run_at, created_at, created_by)
           SELECT ?, ?, ?, ?, ?, 'sending', 0, ?, ?, ?
           WHERE NOT EXISTS (SELECT 1 FROM waitlist_announcements WHERE project = ? AND created_at > ? AND ${COUNTS})`
        )
        .bind(id, project.slug, template, JSON.stringify(fields), fields.subject, iso, iso, who, project.slug, cutoff),
      this.db
        .prepare(
          `INSERT INTO waitlist_announcement_recipients (announcement_id, subscriber_id)
           SELECT a.id, p.subscriber_id FROM waitlist_announcements a
           JOIN waitlist_projects p ON p.project = a.project AND p.status = 'confirmed'
           JOIN waitlist_subscribers s ON s.id = p.subscriber_id AND s.confirmed_at IS NOT NULL
           WHERE a.id = ?`
        )
        .bind(id),
      this.db
        .prepare('UPDATE waitlist_announcements SET total = (SELECT COUNT(*) FROM waitlist_announcement_recipients WHERE announcement_id = ?) WHERE id = ?')
        .bind(id, id),
    ])
    if (created.meta.changes === 0) return (await this.tooSoon(project.slug, cutoff)) ?? { error: 'too_soon', nextAllowedAt: iso }
    const status = (await this.status(id))!
    await this.audit(who, 'start', id, project.slug, { template, subject: fields.subject, total: status.total })
    return { id }
  }

  async status(id: string): Promise<AnnouncementStatus | null> {
    const row = await this.db.prepare('SELECT * FROM waitlist_announcements WHERE id = ?').bind(checkId(id)).first<Row>()
    return row ? toStatus(row) : null
  }

  /** The newest announcements first. */
  async list({ limit = 20 }: { limit?: number } = {}): Promise<AnnouncementStatus[]> {
    const n = Math.max(1, Math.min(100, Math.floor(Number(limit) || 20)))
    const { results } = await this.db.prepare('SELECT * FROM waitlist_announcements ORDER BY created_at DESC, id LIMIT ?').bind(n).all<Row>()
    return results.map(toStatus)
  }

  /**
   * Stops an announcement that is still sending or paused: no one else gets
   * it, and everyone not yet sent to counts as skipped. Returns its status,
   * null for an unknown id; a finished one is left as it is.
   */
  async cancel(id: string, actor: string): Promise<AnnouncementStatus | null> {
    const who = checkActor(actor)
    const before = await this.status(id)
    if (!before) return null
    const iso = this.now().toISOString()
    const [cancelled] = await this.db.batch([
      this.db
        .prepare(
          `UPDATE waitlist_announcements SET state = 'cancelled', finished_at = ?, next_run_at = NULL, skipped = total - sent - failed
           WHERE id = ? AND state IN ('sending', 'paused_cap')`
        )
        .bind(iso, id),
      this.db
        .prepare("UPDATE waitlist_announcement_recipients SET status = 'skipped', done_at = ? WHERE announcement_id = ? AND status = 'pending' AND (SELECT state FROM waitlist_announcements WHERE id = ?) = 'cancelled'")
        .bind(iso, id, id),
    ])
    const after = (await this.status(id))!
    await this.audit(who, 'cancel', id, before.project, { from: before.state, cancelled: cancelled.meta.changes > 0, sent: after.sent })
    return after
  }

  /**
   * One cron run: sends the next batches of every announcement due, oldest
   * first, up to RUN_LIMIT emails, and stops at the first refusal.
   */
  async run(): Promise<RunReport[]> {
    const now = this.now()
    const { results } = await this.db
      .prepare(
        "SELECT * FROM waitlist_announcements WHERE state IN ('sending', 'paused_cap') AND (next_run_at IS NULL OR next_run_at <= ?) ORDER BY created_at, id"
      )
      .bind(now.toISOString())
      .all<Row>()
    const reports: RunReport[] = []
    let budget = RUN_LIMIT
    for (const row of results) {
      const report = await this.sendSome(row, budget)
      reports.push(report)
      budget -= report.sent
      // A refusal stops the whole run: the next announcement would hit the same cap.
      // One for a project that has left /upcoming only waits itself (until it is
      // cancelled): it sends nothing, and must not hold the others up.
      if ((report.stoppedAt && report.stoppedAt !== UNKNOWN_PROJECT) || budget <= 0) break
    }
    return reports
  }

  private async sendSome(row: Row, runBudget: number): Promise<RunReport> {
    const project = findProject(row.project)
    const fields = JSON.parse(row.fields) as Fields
    const report: RunReport = { id: row.id, state: 'sending', sent: 0, failed: 0, skipped: 0 }

    const pause = async (code: string): Promise<RunReport> => {
      const now = this.now()
      await this.db
        .prepare("UPDATE waitlist_announcements SET state = 'paused_cap', last_error = ?, next_run_at = ? WHERE id = ? AND state IN ('sending', 'paused_cap')")
        .bind(code, retryAfter(code, now).toISOString(), row.id)
        .run()
      return { ...report, state: 'paused_cap', stoppedAt: code }
    }

    if (!project || !isTemplateId(row.template)) return pause(UNKNOWN_PROJECT)

    const used = await this.usedBudget()
    let allowed = Math.min(runBudget, DAY_BUDGET - used.day, MONTH_BUDGET - used.month)
    if (allowed <= 0) {
      const now = this.now()
      const code = used.month >= MONTH_BUDGET ? 'budget_month' : 'budget_day'
      await this.db
        .prepare("UPDATE waitlist_announcements SET state = 'paused_cap', last_error = ?, next_run_at = ? WHERE id = ? AND state IN ('sending', 'paused_cap')")
        .bind(code, (code === 'budget_month' ? nextMonth(now) : new Date(startOfDay(now).getTime() + DAY_MS)).toISOString(), row.id)
        .run()
      return { ...report, state: 'paused_cap', stoppedAt: code }
    }

    // Resuming after a pause.
    await this.db
      .prepare("UPDATE waitlist_announcements SET state = 'sending', next_run_at = ? WHERE id = ? AND state IN ('sending', 'paused_cap')")
      .bind(nextRun(this.now()).toISOString(), row.id)
      .run()

    while (allowed > 0) {
      // Cancelled in the meantime: stop.
      const current = await this.db.prepare('SELECT state FROM waitlist_announcements WHERE id = ?').bind(row.id).first<{ state: State }>()
      if (current?.state !== 'sending') return { ...report, state: current?.state ?? 'cancelled' }

      const { results } = await this.db
        .prepare(
          `SELECT r.subscriber_id AS id, s.email, p.status AS project_status
           FROM waitlist_announcement_recipients r
           JOIN waitlist_subscribers s ON s.id = r.subscriber_id
           LEFT JOIN waitlist_projects p ON p.subscriber_id = r.subscriber_id AND p.project = ?
           WHERE r.announcement_id = ? AND r.status = 'pending'
           ORDER BY r.subscriber_id LIMIT ?`
        )
        .bind(row.project, row.id, Math.min(BATCH_SIZE, allowed))
        .all<{ id: string; email: string; project_status: string | null }>()

      if (results.length === 0) {
        await this.db
          .prepare(
            `UPDATE waitlist_announcements SET state = 'done', finished_at = ?, next_run_at = NULL, last_error = NULL, skipped = total - sent - failed
             WHERE id = ? AND state = 'sending'`
          )
          .bind(this.now().toISOString(), row.id)
          .run()
        return { ...report, state: 'done' }
      }

      for (const recipient of results) {
        // Left the project since it started: not sent.
        if (recipient.project_status !== 'confirmed') {
          if (await this.mark(row.id, recipient.id, 'skipped', null)) report.skipped++
          continue
        }

        // A fresh manage link for this email; only its hash is stored.
        const token = newToken()
        const at = this.now().getTime()
        await this.db
          .prepare("INSERT INTO waitlist_tokens (token_hash, subscriber_id, purpose, created_at, expires_at) VALUES (?, ?, 'leave', ?, ?)")
          .bind(tokenHash(token), recipient.id, at, at + LEAVE_LINK_DAYS * DAY_MS)
          .run()
        const dropToken = () => this.db.prepare('DELETE FROM waitlist_tokens WHERE token_hash = ?').bind(tokenHash(token)).run()

        const rendered = renderAnnouncement(project, row.template, fields, leaveUrl(token))
        let result: SendResult
        try {
          result = await this.mail({
            to: recipient.email,
            subject: rendered.subject,
            text: rendered.text,
            html: rendered.html,
            headers: leaveHeaders(token),
            // The same announcement never reaches anyone twice, even if recording it below failed.
            key: `announce:${row.id}:${recipient.id}`,
          })
        } catch (error) {
          result = { ok: false, code: `error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 200), retryable: true, message: '' }
        }

        if (result.ok) {
          // A duplicate went out earlier, with the link made then: this one is unused.
          if (result.duplicate) await dropToken()
          if (await this.mark(row.id, recipient.id, 'sent', null)) report.sent++
          allowed--
        } else if (RECIPIENT_FAILURES.has(result.code)) {
          await dropToken()
          if (await this.mark(row.id, recipient.id, 'failed', result.code)) report.failed++
        } else {
          await dropToken()
          return pause(result.code)
        }
      }
    }
    return report
  }

  /** Records one recipient's outcome once, and counts it on the announcement. False when it was already recorded. */
  private async mark(id: string, subscriberId: string, status: 'sent' | 'failed' | 'skipped', error: string | null): Promise<boolean> {
    const [update] = await this.db.batch([
      this.db
        .prepare(
          "UPDATE waitlist_announcement_recipients SET status = ?, done_at = ?, error = ? WHERE announcement_id = ? AND subscriber_id = ? AND status = 'pending'"
        )
        .bind(status, this.now().toISOString(), error, id, subscriberId),
      this.db
        .prepare(`UPDATE waitlist_announcements SET ${status} = ${status} + 1 WHERE id = ? AND changes() > 0`)
        .bind(id),
    ])
    return update.meta.changes > 0
  }

  /** Announcement emails sent today and this month (UTC). */
  private async usedBudget(): Promise<{ day: number; month: number }> {
    const now = this.now()
    const row = await this.db
      .prepare(
        `SELECT COALESCE(SUM(done_at >= ?), 0) AS day, COUNT(*) AS month FROM waitlist_announcement_recipients
         WHERE status = 'sent' AND done_at >= ?`
      )
      .bind(startOfDay(now).toISOString(), startOfMonth(now).toISOString())
      .first<{ day: number; month: number }>()
    return { day: row?.day ?? 0, month: row?.month ?? 0 }
  }

  private async tooSoon(project: string, cutoff: string): Promise<{ error: 'too_soon'; nextAllowedAt: string } | null> {
    const last = await this.db
      .prepare(`SELECT MAX(created_at) AS at FROM waitlist_announcements WHERE project = ? AND created_at > ? AND ${COUNTS}`)
      .bind(project, cutoff)
      .first<{ at: string | null }>()
    if (!last?.at) return null
    return { error: 'too_soon', nextAllowedAt: new Date(new Date(last.at).getTime() + MIN_DAYS_BETWEEN * DAY_MS).toISOString() }
  }

  private async confirmedCount(project: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM waitlist_projects p JOIN waitlist_subscribers s ON s.id = p.subscriber_id
         WHERE p.project = ? AND p.status = 'confirmed' AND s.confirmed_at IS NOT NULL`
      )
      .bind(project)
      .first<{ n: number }>()
    return row?.n ?? 0
  }

  private async mail(email: { to: string; subject: string; text: string; html: string; headers: Record<string, string>; key: string }): Promise<SendResult> {
    const mailroom = this.deps.mailroom
    if (!mailroom) return { ok: false, code: 'not_configured', retryable: false, message: 'The MAILROOM binding is missing' }
    return mailroom.send({
      kind: 'announce',
      ...email,
      fromName: EMAIL_CONFIG.fromName,
      replyTo: EMAIL_CONFIG.contactEmail,
    })
  }

  private async audit(actor: string, action: 'start' | 'cancel' | 'test', id: string | null, project: string, detail: Record<string, unknown>) {
    await this.db
      .prepare('INSERT INTO waitlist_announcement_audit (at, actor, action, announcement_id, project, detail) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(this.now().toISOString(), actor, action, id, project, JSON.stringify(detail))
      .run()
  }
}
