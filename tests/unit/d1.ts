import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPlatformProxy } from 'wrangler'
import type { D1Database } from '@/lib/db'

/**
 * Real local D1 databases for unit tests: wrangler's own simulation
 * (Miniflare/workerd, the same engine `wrangler dev` uses), in memory, with
 * every migration in migrations/ applied in order, as `wrangler d1
 * migrations apply` would. One per test file (beforeAll); reset() empties
 * the tables between tests.
 */

const ROOT = join(import.meta.dirname, '..', '..')

/** The statements of a migration file, in order. */
export function statements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

async function migrate(db: D1Database, name: 'waitlist' | 'analytics') {
  const dir = join(ROOT, 'migrations', name)
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    for (const statement of statements(readFileSync(join(dir, file), 'utf8'))) await db.prepare(statement).run()
  }
}

async function tables(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND (name LIKE 'waitlist\\_%' ESCAPE '\\' OR name LIKE 'analytics\\_%' ESCAPE '\\' OR name LIKE 'game\\_%' ESCAPE '\\' OR name LIKE 'newsletter\\_%' ESCAPE '\\')")
    .all<{ name: string }>()
  return results.map((r) => r.name)
}

export type TestDatabases = {
  waitlist: D1Database
  analytics: D1Database
  /** Empties every table. */
  reset(): Promise<void>
  dispose(): Promise<void>
}

export async function testDatabases(): Promise<TestDatabases> {
  const proxy = await getPlatformProxy<{ WAITLIST_DB: D1Database; ANALYTICS_DB: D1Database }>({
    configPath: join(ROOT, 'tests', 'unit', 'd1', 'wrangler.jsonc'),
    persist: false,
  })
  const { WAITLIST_DB: waitlist, ANALYTICS_DB: analytics } = proxy.env
  await migrate(waitlist, 'waitlist')
  await migrate(analytics, 'analytics')
  return {
    waitlist,
    analytics,
    async reset() {
      for (const db of [waitlist, analytics]) {
        // Table names from sqlite_master, not input (identifiers can't be bound).
        for (const name of await tables(db)) await db.prepare(`DELETE FROM "${name}"`).run()
      }
    },
    dispose: () => proxy.dispose(),
  }
}
