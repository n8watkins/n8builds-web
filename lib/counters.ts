import type { D1Database } from '@/lib/db'

/**
 * One more for (metric, day, field) in n8builds-analytics' analytics_daily
 * (docs/DATABASE.md): a single upsert, so concurrent counts never lose one.
 * A statement, so callers can run it alone or inside a batch.
 */
export function increment(db: D1Database, metric: string, day: string, field = '', by = 1) {
  return db
    .prepare(
      'INSERT INTO analytics_daily (metric, day, field, count) VALUES (?, ?, ?, ?) ON CONFLICT (metric, day, field) DO UPDATE SET count = count + excluded.count'
    )
    .bind(metric, day, field, by)
}
