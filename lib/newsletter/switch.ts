import type { D1Database } from '@/lib/db'

/**
 * The owner's "Turn newsletter on/off" (migrations/waitlist/0004): one stored
 * setting, off until the owner turns it on from the admin, every change
 * logged with who and when. Off hides every newsletter form and every
 * waitlist-to-Kit element, and the APIs refuse sign-ups for Kit; the waitlist
 * then works as before (its own double opt-in, lib/waitlist/).
 */

export type SwitchState = { on: boolean; at: string | null; by: string | null }

/** The switch; off when it was never set. */
export async function readSwitch(db: D1Database): Promise<SwitchState> {
  const row = await db
    .prepare("SELECT v, updated_at, updated_by FROM newsletter_settings WHERE k = 'switch'")
    .first<{ v: string; updated_at: string; updated_by: string | null }>()
  if (!row) return { on: false, at: null, by: null }
  return { on: row.v === '1', at: row.updated_at, by: row.updated_by }
}

/** Turns the newsletter on or off and logs the change, in one batch. Setting it to what it already is changes and logs nothing. */
export async function setSwitch(db: D1Database, on: boolean, { by = null, now = new Date() }: { by?: string | null; now?: Date } = {}): Promise<SwitchState> {
  const was = await readSwitch(db)
  if (was.at && was.on === on) return was
  const at = now.toISOString()
  await db.batch([
    db
      .prepare(
        `INSERT INTO newsletter_settings (k, v, updated_at, updated_by) VALUES ('switch', ?, ?, ?)
         ON CONFLICT (k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
      )
      .bind(on ? '1' : '0', at, by),
    db.prepare('INSERT INTO newsletter_switch_log (turned_on, at, by) VALUES (?, ?, ?)').bind(on ? 1 : 0, at, by),
  ])
  return { on, at, by }
}

/** The latest changes, newest first. */
export async function switchLog(db: D1Database, limit = 10): Promise<{ on: boolean; at: string; by: string | null }[]> {
  const { results } = await db
    .prepare('SELECT turned_on, at, by FROM newsletter_switch_log ORDER BY id DESC LIMIT ?')
    .bind(limit)
    .all<{ turned_on: number; at: string; by: string | null }>()
  return results.map((r) => ({ on: r.turned_on === 1, at: r.at, by: r.by }))
}
