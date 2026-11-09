import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LEAVE_LINK_DAYS, PENDING_DAYS, WaitlistStore, entryId, tokenHash, type WaitlistEntry } from '@/lib/waitlist/store'
import { cleanReferrer } from '@/lib/waitlist/schema'
import { purgeExpired } from '@/lib/retention'
import { confirmUrl, createConfirmHtml, createConfirmText, createLeaveHtml, leaveUrl, projectList } from '@/lib/email/waitlist'
import { testDatabases, type TestDatabases } from './d1'

const DAY = 86_400_000
const T0 = new Date('2026-11-01T10:00:00.000Z')

let dbs: TestDatabases
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())
beforeEach(() => dbs.reset())

/** A store whose clock the test moves. */
function storeAt(start = T0) {
  let now = start
  const store = new WaitlistStore(dbs.waitlist, () => now)
  return { store, later: (ms: number) => (now = new Date(now.getTime() + ms)) }
}

const request = (overrides: Partial<Parameters<WaitlistStore['join']>[0]> = {}) => ({
  email: 'visitor@example.com',
  projects: ['relink' as const],
  note: '42',
  interest: 'relink',
  referrer: '',
  ...overrides,
})

const all = async (sql: string) => (await dbs.waitlist.prepare(sql).all()).results

describe('WaitlistStore (n8builds-waitlist)', () => {
  it('saves a join as a request waiting on its confirm link, with a 7-day expiry', async () => {
    const { store } = storeAt()
    const entry = await store.join(request())
    expect(entry).toEqual({
      id: entryId('visitor@example.com'),
      email: 'visitor@example.com',
      projects: [],
      requested: ['relink'],
      // A note that looks like a number stays text.
      note: '',
      requestedNote: '42',
      createdAt: T0.toISOString(),
      updatedAt: T0.toISOString(),
      confirmedAt: '',
      interest: 'relink',
      referrer: '',
    })
    expect(await all('SELECT expires_at FROM waitlist_subscribers')).toEqual([{ expires_at: T0.getTime() + PENDING_DAYS * DAY }])
  })

  it('never makes a second row for the same address or project, however often it joins', async () => {
    const { store } = storeAt()
    await Promise.all([store.join(request()), store.join(request()), store.join(request({ projects: ['relink', 'feelium'] }))])
    expect(await all('SELECT COUNT(*) AS n FROM waitlist_subscribers')).toEqual([{ n: 1 }])
    expect(await all('SELECT project FROM waitlist_projects ORDER BY project')).toEqual([{ project: 'feelium' }, { project: 'relink' }])
  })

  it('keeps every project slug, KeysReady and Feelium included', async () => {
    const { store } = storeAt()
    const projects = ['relink', 'strollz', 'vibelog', 'keysready', 'asset-arsenal', 'feelium'] as const
    const entry = await store.join(request({ projects: [...projects] }))
    expect([...entry.requested].sort()).toEqual([...projects].sort())
  })

  it('stores link tokens only as hashes', async () => {
    const { store } = storeAt()
    const links = await store.issueLinks(await store.join(request()))
    const stored = JSON.stringify(await all('SELECT * FROM waitlist_tokens'))
    expect(stored).not.toContain(links.confirm)
    expect(stored).not.toContain(links.leave)
    expect(stored).toContain(tokenHash(links.confirm))
    expect(await all('SELECT purpose, expires_at FROM waitlist_tokens ORDER BY purpose')).toEqual([
      { purpose: 'confirm', expires_at: T0.getTime() + PENDING_DAYS * DAY },
      { purpose: 'leave', expires_at: T0.getTime() + LEAVE_LINK_DAYS * DAY },
    ])
  })

  it('confirms once: everything requested becomes confirmed, and the link is spent', async () => {
    const { store } = storeAt()
    const links = await store.issueLinks(await store.join(request({ projects: ['relink', 'keysready'] })))
    // A double click: two confirms at once, one wins.
    const results = await Promise.all([store.confirm(links.confirm), store.confirm(links.confirm)])
    expect(results.filter(Boolean)).toHaveLength(1)
    const confirmed = results.find(Boolean)!
    expect(confirmed).toMatchObject({ requested: [], note: '42', requestedNote: '', confirmedAt: T0.toISOString() })
    expect([...confirmed.projects].sort()).toEqual(['keysready', 'relink'])
    expect(await store.confirm(links.confirm)).toBeNull()
    // Confirmed entries no longer expire.
    expect(await all('SELECT expires_at FROM waitlist_subscribers')).toEqual([{ expires_at: null }])
  })

  it('never changes a confirmed project or note on a later join until that is confirmed too', async () => {
    const { store, later } = storeAt()
    await store.confirm((await store.issueLinks(await store.join(request()))).confirm)
    later(DAY)
    const again = await store.join(request({ projects: ['relink', 'strollz'], note: 'walks' }))
    expect(again).toMatchObject({ projects: ['relink'], requested: ['strollz'], note: '42', requestedNote: 'walks' })
    expect(await all('SELECT expires_at FROM waitlist_subscribers')).toEqual([{ expires_at: null }])
  })

  it('refuses an expired confirm link, and hides an unconfirmed entry after 7 days', async () => {
    const { store, later } = storeAt()
    const entry = await store.join(request())
    const links = await store.issueLinks(entry)
    later(PENDING_DAYS * DAY + 1)
    expect(await store.confirm(links.confirm)).toBeNull()
    expect(await store.get(entry.id)).toBeNull()
    // Joining again starts over: a fresh entry, not the stale one.
    const fresh = await store.join(request({ projects: ['vibelog'], note: '' }))
    expect(fresh).toMatchObject({ requested: ['vibelog'], requestedNote: '' })
    expect(fresh.createdAt).not.toBe(T0.toISOString())
  })

  it('leaves with a leave link only, deleting the entry, its projects and its links', async () => {
    const { store } = storeAt()
    const links = await store.issueLinks(await store.join(request()))
    expect(await store.leave(links.confirm)).toBe(false)
    expect(await store.leave(links.leave)).toBe(true)
    expect(await store.leave(links.leave)).toBe(false)
    for (const table of ['waitlist_subscribers', 'waitlist_projects', 'waitlist_tokens']) {
      expect(await all(`SELECT COUNT(*) AS n FROM ${table}`), table).toEqual([{ n: 0 }])
    }
  })

  it('deletes by id for a deletion request', async () => {
    const { store } = storeAt()
    const entry = await store.join(request())
    expect(await store.remove(entry.id)).toBe(true)
    expect(await store.get(entry.id)).toBeNull()
  })

  it('rejects rows bigger than the form allows, and unnormalized addresses', async () => {
    const insert = (email: string, note = '') =>
      dbs.waitlist
        .prepare("INSERT INTO waitlist_subscribers (id, email, note, created_at, updated_at, expires_at) VALUES (?, ?, ?, 'x', 'x', 1)")
        .bind('a'.repeat(32), email, note)
        .run()
    await expect(insert('Visitor@Example.com')).rejects.toThrow()
    await expect(insert('v@example.com', 'x'.repeat(501))).rejects.toThrow()
  })
})

describe('the daily cleanup', () => {
  it('purges unconfirmed entries, expired and used links, and nothing confirmed', async () => {
    const { store, later } = storeAt()
    const pending = await store.join(request({ email: 'pending@example.com' }))
    await store.issueLinks(pending)
    const kept = await store.issueLinks(await store.join(request()))
    await store.confirm(kept.confirm)
    later(PENDING_DAYS * DAY + 1)
    const deleted = await purgeExpired({ waitlist: dbs.waitlist }, new Date(T0.getTime() + PENDING_DAYS * DAY + 1))
    expect(deleted.waitlist).toBeGreaterThan(0)
    expect(await all('SELECT email FROM waitlist_subscribers')).toEqual([{ email: 'visitor@example.com' }])
    // Only the confirmed entry's leave link is left.
    expect(await all('SELECT purpose FROM waitlist_tokens')).toEqual([{ purpose: 'leave' }])
    expect(await store.leave(kept.leave)).toBe(true)
  })

  it('drops counters and players older than KEEP_DAYS, and old salts and rounds', async () => {
    const db = dbs.analytics
    const now = new Date('2026-11-04T12:00:00Z')
    await db.batch([
      db.prepare("INSERT INTO analytics_daily (metric, day, field, count) VALUES ('contact:sent', '2025-09-29', '', 1), ('contact:sent', '2025-09-30', '', 1)"),
      db.prepare("INSERT INTO game_salts (day, salt) VALUES ('2026-11-02', 'a'), ('2026-11-03', 'b'), ('2026-11-04', 'c')"),
      db.prepare("INSERT INTO game_players (day, site, player, rounds) VALUES ('2025-09-01', 'n8builds', ?, 1)").bind('p'.repeat(24)),
      db.prepare("INSERT INTO game_rounds (id, player, site, country, started_at, expires_at) VALUES (?, 'p', 'n8builds', 'US', 0, ?)").bind('r'.repeat(24), now.getTime() - 1),
    ])
    await purgeExpired({ analytics: db }, now)
    const rows = async (sql: string) => (await db.prepare(sql).all()).results
    // The oldest day kept is exactly KEEP_DAYS (400) back: 2025-09-30.
    expect(await rows('SELECT day FROM analytics_daily')).toEqual([{ day: '2025-09-30' }])
    expect(await rows('SELECT day FROM game_salts ORDER BY day')).toEqual([{ day: '2026-11-03' }, { day: '2026-11-04' }])
    expect(await rows('SELECT COUNT(*) AS n FROM game_players')).toEqual([{ n: 0 }])
    expect(await rows('SELECT COUNT(*) AS n FROM game_rounds')).toEqual([{ n: 0 }])
  })
})

describe('cleanReferrer', () => {
  it('keeps origin and path only', () => {
    expect(cleanReferrer('https://example.com/a/b?token=secret#x')).toBe('https://example.com/a/b')
    expect(cleanReferrer('javascript:alert(1)')).toBe('')
    expect(cleanReferrer('not a url')).toBe('')
    expect(cleanReferrer(undefined)).toBe('')
  })
})

const entry: WaitlistEntry = {
  id: 'abc',
  email: 'visitor@example.com',
  projects: [],
  requested: ['relink', 'strollz'],
  note: '',
  requestedNote: '42',
  createdAt: T0.toISOString(),
  updatedAt: T0.toISOString(),
  confirmedAt: '',
  interest: 'relink',
  referrer: '',
}
const links = { confirm: 'tok_confirmabcdefghijklmnopqrstuvwxyz', leave: 'tok_leaveabcdefghijklmnopqrstuvwxyz' }

describe('waitlist emails', () => {
  it('link to the confirm and leave pages with their own tokens', () => {
    const html = createConfirmHtml(entry, links)
    expect(html).toContain(confirmUrl(links.confirm))
    expect(html).toContain(leaveUrl(links.leave))
    expect(confirmUrl(links.confirm)).toBe('https://n8builds.dev/upcoming/confirm?t=tok_confirmabcdefghijklmnopqrstuvwxyz')
    expect(createConfirmText(entry, links)).toContain(leaveUrl(links.leave))
    expect(createLeaveHtml(links.leave)).toContain(leaveUrl(links.leave))
  })

  it("never repeat the visitor's note", () => {
    const withNote = { ...entry, requestedNote: 'Visit https://scam.example now' }
    expect(createConfirmHtml(withNote, links)).not.toContain('scam.example')
    expect(createConfirmText(withNote, links)).not.toContain('scam.example')
  })

  it('name the projects asked for', () => {
    expect(projectList(['relink'])).toBe('Relink')
    expect(projectList(['relink', 'strollz'])).toBe('Relink and Strollz')
    expect(projectList(['vibelog', 'relink', 'strollz'])).toBe('Relink, Strollz and VibeLog')
    expect(projectList(['keysready', 'vibelog', 'relink', 'strollz'])).toBe('Relink, KeysReady, Strollz and VibeLog')
    expect(createConfirmText({ ...entry, requested: ['keysready'] }, links)).toContain('waitlist for KeysReady on n8builds.dev')
    expect(createConfirmHtml({ ...entry, requested: ['feelium'] }, links)).toContain('Feelium')
    expect(createConfirmHtml(entry, links)).toContain('Relink and Strollz')
  })
})
