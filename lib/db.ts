import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * The site's D1 databases (docs/DATABASE.md):
 * - WAITLIST_DB  n8builds-waitlist: the waitlist's personal data
 * - ANALYTICS_DB n8builds-analytics: anonymous counters and the dino game
 *
 * On Workers the bindings come from the request's context. Under `next dev`,
 * `next start` and the build, OpenNext's async context runs wrangler's local
 * simulation instead (.wrangler/state; `npm run db:migrate:local` creates the
 * tables). Null where neither exists (unit tests inject their own).
 */

/** The part of D1's API this site uses (the full types are in @cloudflare/workers-types). */
export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success: boolean
  meta: { changes: number }
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
}

type Binding = 'WAITLIST_DB' | 'ANALYTICS_DB'
type Env = Awaited<ReturnType<typeof getCloudflareContext>>['env']

// Off Workers, one local simulation per process: two at once would fight over
// the same SQLite files (SQLITE_BUSY), so concurrent first requests share it.
const LOCAL = Symbol.for('n8builds.localCloudflareEnv')
type WithLocal = typeof globalThis & { [LOCAL]?: Promise<Env> }

async function cloudflareEnv(): Promise<Env> {
  try {
    // On Workers (and once the local simulation is up) the context is already there.
    return getCloudflareContext().env
  } catch {
    const global = globalThis as WithLocal
    global[LOCAL] ??= getCloudflareContext({ async: true })
      .then((context) => context.env)
      .catch((error) => {
        global[LOCAL] = undefined
        throw error
      })
    return global[LOCAL]
  }
}

async function binding(name: Binding): Promise<D1Database | null> {
  try {
    const db: D1Database | undefined = (await cloudflareEnv())[name]
    return db ?? null
  } catch {
    return null
  }
}

/** n8builds-waitlist, or null where there is no D1 (unit tests). */
export const waitlistDb = () => binding('WAITLIST_DB')

/** n8builds-analytics, or null where there is no D1 (unit tests). */
export const analyticsDb = () => binding('ANALYTICS_DB')
