import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LEAVE_LINK_DAYS, PENDING_DAYS, WaitlistStore, entryId, tokenHash, type WaitlistEntry } from '@/lib/waitlist/store'
import { cleanReferrer } from '@/lib/waitlist/schema'
import { purgeExpired } from '@/lib/retention'
import { confirmUrl, createConfirmHtml, createConfirmText, createLeaveHtml, leaveHeaders, leaveUrl, projectList } from '@/lib/email/waitlist'
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
  projects: ['feelium' as const],
  note: '42',
  interest: 'feelium',
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
      requested: ['feelium'],
      // A note that looks like a number stays text.
      note: '',
      requestedNote: '42',
      createdAt: T0.toISOString(),
      updatedAt: T0.toISOString(),
      confirmedAt: '',
      interest: 'feelium',
      referrer: '',
    })
    expect(await all('SELECT expires_at FROM waitlist_subscribers')).toEqual([{ expires_at: T0.getTime() + PENDING_DAYS * DAY }])
  })

  it('never makes a second row for the same address or project, however often it joins', async () => {
    const { store } = storeAt()
    await Promise.all([store.join(request()), store.join(request()), store.join(request({ projects: ['feelium', 'pivot'] }))])
    expect(await all('SELECT COUNT(*) AS n FROM waitlist_subscribers')).toEqual([{ n: 1 }])
    expect(await all('SELECT project FROM waitlist_projects ORDER BY project')).toEqual([{ project: 'feelium' }, { project: 'pivot' }])
  })

  it('keeps every project slug', async () => {
    const { store } = storeAt()
    const projects = ['fitflow7', 'cutelyaskme', 'feelium', 'whoami', 'pivot'] as const
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
    const links = await store.issueLinks(await store.join(request({ projects: ['pivot', 'feelium'] })))
    // A double click: two confirms at once, one wins.
    const results = await Promise.all([store.confirm(links.confirm), store.confirm(links.confirm)])
    expect(results.filter(Boolean)).toHaveLength(1)
    const confirmed = results.find(Boolean)!
    expect(confirmed).toMatchObject({ requested: [], note: '42', requestedNote: '', confirmedAt: T0.toISOString() })
    expect([...confirmed.projects].sort()).toEqual(['feelium', 'pivot'])
    expect(await store.confirm(links.confirm)).toBeNull()
    // Confirmed entries no longer expire.
    expect(await all('SELECT expires_at FROM waitlist_subscribers')).toEqual([{ expires_at: null }])
  })

  it('never changes a confirmed project or note on a later join until that is confirmed too', async () => {
    const { store, later } = storeAt()
    await store.confirm((await store.issueLinks(await store.join(request()))).confirm)
    later(DAY)
    const again = await store.join(request({ projects: ['feelium', 'fitflow7'], note: 'walks' }))
    expect(again).toMatchObject({ projects: ['feelium'], requested: ['fitflow7'], note: '42', requestedNote: 'walks' })
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
    const fresh = await store.join(request({ projects: ['cutelyaskme'], note: '' }))
    expect(fresh).toMatchObject({ requested: ['cutelyaskme'], requestedNote: '' })
    expect(fresh.createdAt).not.toBe(T0.toISOString())
  })

  it('manages with a leave link only: keeps the projects ticked, and keeping none leaves', async () => {
    const { store, later } = storeAt()
    const entry = await store.join(request({ projects: ['feelium', 'fitflow7', 'cutelyaskme'] }))
    const links = await store.issueLinks(entry)
    await store.confirm(links.confirm)

    expect(await store.forLeaveToken(links.confirm)).toBeNull()
    expect((await store.forLeaveToken(links.leave))?.projects.sort()).toEqual(['cutelyaskme', 'feelium', 'fitflow7'])

    const kept = await store.keepOnly(links.leave, ['fitflow7'])
    expect(kept).toMatchObject({ projects: ['fitflow7'], requested: [] })
    // The link keeps working, for the same address only.
    expect((await store.forLeaveToken(links.leave))?.id).toBe(entry.id)
    // Keeping only a project it isn't on leaves nothing: the entry goes.
    expect(await store.keepOnly(links.leave, ['feelium'])).toBeNull()
    expect(await all('SELECT COUNT(*) AS n FROM waitlist_subscribers')).toEqual([{ n: 0 }])

    // Keeping none is leaving; an expired link does nothing.
    const again = await store.issueLinks(await store.join(request({ email: 'b@example.com' })))
    expect(await store.keepOnly(again.leave, [])).toBeNull()
    expect(await all('SELECT COUNT(*) AS n FROM waitlist_subscribers')).toEqual([{ n: 0 }])
    const third = await store.issueLinks(await store.join(request({ email: 'c@example.com' })))
    later(LEAVE_LINK_DAYS * DAY)
    expect(await store.forLeaveToken(third.leave)).toBeNull()
    expect(await store.keepOnly(third.leave, ['feelium'])).toBeNull()
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

  it('leaves the rows of a project that is no longer in the data where they are, and never reads them', async () => {
    // Should a project ever be taken out of data/upcoming.ts ("strollz" stands in for one here by
    // renaming rows; the real Strollz is unlisted, not removed): people already on it keep their rows.
    const { store, later } = storeAt()
    const entry = await store.join(request({ projects: ['feelium', 'pivot'] }))
    const links = await store.issueLinks(entry)
    const retired = () => all("SELECT project, status FROM waitlist_projects WHERE project = 'retired-one' ORDER BY subscriber_id")
    await dbs.waitlist.prepare("UPDATE waitlist_projects SET project = 'retired-one' WHERE subscriber_id = ? AND project = 'pivot'").bind(entry.id).run()
    // Someone whose only project it was, already confirmed.
    const only = await store.join(request({ email: 'only@example.com' }))
    await store.confirm((await store.issueLinks(only)).confirm)
    await dbs.waitlist.prepare("UPDATE waitlist_projects SET project = 'retired-one' WHERE subscriber_id = ?").bind(only.id).run()

    // Not in what the site, the emails or the manage page read ...
    expect(await store.get(entry.id)).toMatchObject({ projects: [], requested: ['feelium'] })
    expect(await store.get(only.id)).toMatchObject({ projects: [], requested: [] })
    expect(projectList((await store.get(only.id))!.projects)).toBe('')
    // ... and joining again, confirming and the daily cleanup leave the rows in place.
    later(DAY)
    await store.join(request({ projects: ['fitflow7'] }))
    expect(await store.confirm(links.confirm)).toMatchObject({ projects: ['feelium', 'fitflow7'], requested: [] })
    await purgeExpired({ waitlist: dbs.waitlist }, new Date(T0.getTime() + 30 * DAY))
    expect(await retired()).toEqual([{ project: 'retired-one', status: 'confirmed' }, { project: 'retired-one', status: 'confirmed' }])
    expect(await all('SELECT COUNT(*) AS n FROM waitlist_subscribers')).toEqual([{ n: 2 }])
    // Leaving is still theirs to do, and takes the row with it.
    expect(await store.leave(links.leave)).toBe(true)
    expect(await retired()).toEqual([{ project: 'retired-one', status: 'confirmed' }])
  })

  it('keeps an unlisted project like any other: joined, confirmed, read back, and named in its emails', async () => {
    const { store } = storeAt()
    const unlisted = ['keysready', 'strollz', 'vibelog', 'asset-arsenal'] as const
    const joined = await store.join(request({ projects: [...unlisted] }))
    expect([...joined.requested].sort()).toEqual([...unlisted].sort())
    const links = await store.issueLinks(joined)
    const html = createConfirmHtml(joined, links)
    for (const slug of unlisted) expect(html).toContain(`https://n8builds.dev/email/upcoming/${slug}.png`)
    expect(projectList(joined.requested)).toBe('KeysReady, Strollz, VibeLog and Asset Arsenal')
    const confirmed = await store.confirm(links.confirm)
    expect([...confirmed!.projects].sort()).toEqual([...unlisted].sort())
    expect((await store.keepOnly(links.leave, ['keysready']))?.projects).toEqual(['keysready'])
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
  requested: ['feelium', 'fitflow7'],
  note: '',
  requestedNote: '42',
  createdAt: T0.toISOString(),
  updatedAt: T0.toISOString(),
  confirmedAt: '',
  interest: 'feelium',
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
    expect(createLeaveHtml(entry, links.leave)).toContain(leaveUrl(links.leave))
  })

  it('show each project as a card with its PNG icon, name and one line, linked by absolute https URL', () => {
    const html = createConfirmHtml({ ...entry, requested: ['pivot', 'fitflow7', 'pivot'] }, links)
    for (const slug of ['pivot', 'fitflow7', 'pivot']) {
      expect(html).toContain(`<img src="https://n8builds.dev/email/upcoming/${slug}.png" width="40" height="40"`)
    }
    expect(html).toContain('The no-excuses 7-minute workout timer')
    // The header's N8 mark: an absolute PNG, never a CID, SVG or data: image.
    expect(html).toContain('<img src="https://n8builds.dev/email/logo.png" width="32" height="32" alt="n8builds"')
    expect(html).not.toMatch(/src="(cid:|data:)|\.svg"/)
  })

  it('carry one-click List-Unsubscribe headers that leave the whole waitlist', () => {
    expect(leaveHeaders(links.leave)).toEqual({
      'List-Unsubscribe': '<https://n8builds.dev/api/waitlist/leave?t=tok_leaveabcdefghijklmnopqrstuvwxyz>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
  })

  it("never repeat the visitor's note", () => {
    const withNote = { ...entry, requestedNote: 'Visit https://scam.example now' }
    expect(createConfirmHtml(withNote, links)).not.toContain('scam.example')
    expect(createConfirmText(withNote, links)).not.toContain('scam.example')
  })

  it('name the projects asked for', () => {
    expect(projectList(['feelium'])).toBe('Feelium')
    expect(projectList(['feelium', 'fitflow7'])).toBe('Feelium and FitFlow 7')
    expect(projectList(['cutelyaskme', 'feelium', 'fitflow7'])).toBe('Feelium, FitFlow 7 and Cutely Ask Me')
    expect(projectList(['pivot', 'cutelyaskme', 'feelium', 'fitflow7'])).toBe('Feelium, FitFlow 7, Pivot and Cutely Ask Me')
    expect(createConfirmText({ ...entry, requested: ['feelium'] }, links)).toContain('waitlist for Feelium on n8builds.dev')
    expect(createConfirmHtml({ ...entry, requested: ['pivot'] }, links)).toContain('Pivot')
    expect(createConfirmHtml(entry, links)).toContain('Feelium and FitFlow 7')
  })
})
