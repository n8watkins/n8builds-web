import { createHash, randomBytes } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { isUpcomingSlug, type UpcomingSlug } from '@/data/upcoming'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * Where waitlist sign-ups live: the analytics database (ANALYTICS_REDIS_REST_URL
 * and _TOKEN, lib/analyticsStore.ts), which the admin dashboard already reads
 * (its Waitlist page). Unlike the counters beside them, these hold what a
 * visitor typed: their email, projects and note, kept until they leave.
 *
 * Keys (production; anything else is namespaced `waitlist:<env>:`, so local
 * runs and previews never touch the real list):
 * - `waitlist:entry:<id>`  hash, one per address (id = hash of the address)
 * - `waitlist:token:<t>`   the entry id behind a confirm or leave link
 * - `waitlist:all`         sorted set of entry ids by sign-up time
 * An unconfirmed entry and its token expire after PENDING_DAYS; confirming
 * keeps them until the visitor leaves (which deletes all three).
 */

export const PENDING_DAYS = 7
const PENDING_SECONDS = PENDING_DAYS * 24 * 60 * 60

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
  /** The secret in this entry's confirm and leave links. */
  token: string
}

export interface WaitlistStore {
  get(id: string): Promise<WaitlistEntry | null>
  /** Writes the entry, its token and its place in the list; unconfirmed entries expire. */
  save(entry: WaitlistEntry): Promise<void>
  idForToken(token: string): Promise<string | null>
  remove(entry: WaitlistEntry): Promise<void>
}

export const entryId = (normalizedEmail: string) => createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 32)

export const newToken = () => randomBytes(24).toString('base64url')

const slugs = (value: string | undefined): UpcomingSlug[] => (value ?? '').split(',').filter(isUpcomingSlug)

export function toFields(entry: WaitlistEntry): Record<string, string> {
  return {
    email: entry.email,
    projects: entry.projects.join(','),
    requested: entry.requested.join(','),
    note: entry.note,
    requestedNote: entry.requestedNote,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    confirmedAt: entry.confirmedAt,
    interest: entry.interest,
    referrer: entry.referrer,
    token: entry.token,
  }
}

export function fromFields(id: string, fields: Record<string, string> | null): WaitlistEntry | null {
  if (!fields || !fields.email || !fields.token) return null
  return {
    id,
    email: fields.email,
    projects: slugs(fields.projects),
    requested: slugs(fields.requested),
    note: fields.note ?? '',
    requestedNote: fields.requestedNote ?? '',
    createdAt: fields.createdAt ?? '',
    updatedAt: fields.updatedAt ?? '',
    confirmedAt: fields.confirmedAt ?? '',
    interest: fields.interest ?? '',
    referrer: fields.referrer ?? '',
    token: fields.token,
  }
}

export class RedisWaitlistStore implements WaitlistStore {
  constructor(
    private readonly redis: Pick<Redis, 'hgetall' | 'get' | 'multi'>,
    private readonly prefix = 'waitlist'
  ) {}

  private entryKey = (id: string) => `${this.prefix}:entry:${id}`
  private tokenKey = (token: string) => `${this.prefix}:token:${token}`
  private listKey = () => `${this.prefix}:all`

  async get(id: string) {
    return fromFields(id, await this.redis.hgetall<Record<string, string>>(this.entryKey(id)))
  }

  async save(entry: WaitlistEntry) {
    const tx = this.redis.multi()
    tx.hset(this.entryKey(entry.id), toFields(entry))
    tx.set(this.tokenKey(entry.token), entry.id)
    tx.zadd(this.listKey(), { score: Date.parse(entry.createdAt), member: entry.id })
    if (entry.confirmedAt) {
      tx.persist(this.entryKey(entry.id))
      tx.persist(this.tokenKey(entry.token))
    } else {
      tx.expire(this.entryKey(entry.id), PENDING_SECONDS)
      tx.expire(this.tokenKey(entry.token), PENDING_SECONDS)
    }
    await tx.exec()
  }

  async idForToken(token: string) {
    return this.redis.get<string>(this.tokenKey(token))
  }

  async remove(entry: WaitlistEntry) {
    const tx = this.redis.multi()
    tx.del(this.entryKey(entry.id), this.tokenKey(entry.token))
    tx.zrem(this.listKey(), entry.id)
    await tx.exec()
  }
}

/** For tests and CONTACT_TEST_MODE: one process's memory, gone on restart. Expiry isn't modelled. */
export class MemoryWaitlistStore implements WaitlistStore {
  readonly entries = new Map<string, WaitlistEntry>()
  private readonly tokens = new Map<string, string>()

  async get(id: string) {
    const entry = this.entries.get(id)
    return entry ? { ...entry } : null
  }

  async save(entry: WaitlistEntry) {
    this.entries.set(entry.id, { ...entry })
    this.tokens.set(entry.token, entry.id)
  }

  async idForToken(token: string) {
    return this.tokens.get(token) ?? null
  }

  async remove(entry: WaitlistEntry) {
    this.entries.delete(entry.id)
    this.tokens.delete(entry.token)
  }
}

/** Key prefix: production keeps the bare name, everything else is namespaced. */
function keyPrefix(): string {
  const env = process.env.APP_ENV || 'local'
  return env === 'production' ? 'waitlist' : `waitlist:${env}`
}

let store: WaitlistStore | null = null
const testStore = new MemoryWaitlistStore()

/**
 * The waitlist's store, or null while the analytics database isn't configured
 * (the page then says the waitlist opens soon). Test mode keeps it in memory.
 */
export function waitlistStore(): WaitlistStore | null {
  if (isContactTestMode()) return testStore
  const url = process.env.ANALYTICS_REDIS_REST_URL
  const token = process.env.ANALYTICS_REDIS_REST_TOKEN
  if (!url || !token) return null
  // Its own client, without automatic JSON parsing: a note such as "42" must stay a string.
  store ??= new RedisWaitlistStore(new Redis({ url, token, automaticDeserialization: false }), keyPrefix())
  return store
}

/** Whether sign-ups can be stored at all; decides between the form and "opens soon". */
export function isWaitlistOpen(): boolean {
  return isContactTestMode() || Boolean(process.env.ANALYTICS_REDIS_REST_URL && process.env.ANALYTICS_REDIS_REST_TOKEN)
}
