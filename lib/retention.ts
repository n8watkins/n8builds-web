import type { D1Database } from '@/lib/db'
import { keepCutoff, saltCutoff, utcDate } from '@/lib/game/stats'

/**
 * The daily cleanup (a Cron Trigger, worker/index.js), the retention rules of
 * docs/DATABASE.md. Every query already ignores expired rows; this deletes them.
 * Each database's statements run as one batch.
 */
export async function purgeExpired(
  dbs: { waitlist?: D1Database | null; analytics?: D1Database | null },
  now = new Date()
): Promise<{ waitlist: number; analytics: number }> {
  const at = now.getTime()
  const today = utcDate(now)
  const changes = (results: { meta: { changes: number } }[]) => results.reduce((sum, r) => sum + r.meta.changes, 0)
  let waitlist = 0
  let analytics = 0
  if (dbs.waitlist) {
    const db = dbs.waitlist
    waitlist = changes(
      await db.batch([
        // Unconfirmed and past their 7 days; their projects and tokens go with them (cascade).
        db.prepare('DELETE FROM waitlist_subscribers WHERE expires_at IS NOT NULL AND expires_at <= ?').bind(at),
        // Expired links, and confirm links already used.
        db.prepare("DELETE FROM waitlist_tokens WHERE expires_at <= ? OR (purpose = 'confirm' AND used_at IS NOT NULL)").bind(at),
        // The newsletter: unconfirmed sign-ups past their 7 days.
        db.prepare('DELETE FROM newsletter_subscribers WHERE expires_at IS NOT NULL AND expires_at <= ?').bind(at),
        // Who had a digest is only needed while it sends: kept 30 days after it finished.
        db
          .prepare("DELETE FROM newsletter_deliveries WHERE digest_id IN (SELECT id FROM newsletter_digests WHERE finished_at IS NOT NULL AND finished_at <= ?)")
          .bind(new Date(at - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ])
    )
  }
  if (dbs.analytics) {
    const db = dbs.analytics
    const cutoff = keepCutoff(today)
    analytics = changes(
      await db.batch([
        db.prepare('DELETE FROM analytics_daily WHERE day < ?').bind(cutoff),
        db.prepare('DELETE FROM game_players WHERE day < ?').bind(cutoff),
        db.prepare('DELETE FROM game_salts WHERE day < ?').bind(saltCutoff(today)),
        db.prepare('DELETE FROM game_rounds WHERE expires_at <= ?').bind(at),
      ])
    )
  }
  return { waitlist, analytics }
}
