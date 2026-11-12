import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { UPCOMING } from '@/data/upcoming'
import {
  Announcements,
  DAY_BUDGET,
  RUN_LIMIT,
  type AnnounceMailroom,
  type SendResult,
} from '@/lib/announce/service'
import { InvalidAnnouncement, PREVIEW_MANAGE_URL, TEMPLATES, defaultFields, renderAnnouncement, resolveFields } from '@/lib/announce/templates'
import { WaitlistStore, tokenHash } from '@/lib/waitlist/store'
import { purgeExpired } from '@/lib/retention'
import { testDatabases, type TestDatabases } from './d1'

const DAY = 86_400_000
const T0 = new Date('2026-11-02T10:00:00.000Z')
const OWNER = 'owner@example.com'
const feelium = UPCOMING.find((p) => p.slug === 'feelium')!

let dbs: TestDatabases
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())
beforeEach(() => dbs.reset())

type Sent = Parameters<AnnounceMailroom['send']>[0]

/**
 * A fake mailroom with mailroom's idempotency: a key that already went out
 * comes back as a duplicate and isn't delivered again. `refuse(n, code)`
 * refuses from the n-th send on (counting from now).
 */
function fakeMailroom() {
  const delivered: Sent[] = []
  const keys = new Set<string>()
  let refuseIn = Infinity
  let code = 'cap_app_day'
  let calls = 0
  const mailroom: AnnounceMailroom = {
    async send(request) {
      calls++
      if (keys.has(request.key)) return { ok: true, messageId: `dup-${request.key}`, duplicate: true }
      if (refuseIn <= 0) return { ok: false, code, retryable: false, message: 'refused' }
      refuseIn--
      keys.add(request.key)
      delivered.push(request)
      return { ok: true, messageId: `m-${delivered.length}` }
    },
  }
  return {
    mailroom,
    delivered,
    calls: () => calls,
    refuse(after: number, c = 'cap_app_day') {
      refuseIn = after
      code = c
    },
    allow: () => (refuseIn = Infinity),
    /** Forget that the keys went out (a mailroom without idempotency), to prove the database alone prevents a resend. */
    forgetKeys: () => keys.clear(),
  }
}

function setup(start = T0) {
  let now = start
  const at = () => now
  const fake = fakeMailroom()
  const service = new Announcements({ db: dbs.waitlist, mailroom: fake.mailroom, ownerEmail: OWNER, now: at })
  const waitlist = new WaitlistStore(dbs.waitlist, at)
  return {
    service,
    fake,
    waitlist,
    at,
    later: (ms: number) => (now = new Date(now.getTime() + ms)),
    /** Confirmed people on a project. */
    async people(n: number, project: 'feelium' | 'fitflow7' = 'feelium', prefix = 'p') {
      const ids: string[] = []
      for (let i = 0; i < n; i++) {
        const entry = await waitlist.join({ email: `${prefix}${i}@example.com`, projects: [project], note: '', interest: '', referrer: '' })
        await waitlist.confirm((await waitlist.issueLinks(entry)).confirm)
        ids.push(entry.id)
      }
      return ids
    },
  }
}

const launch = { project: 'feelium', template: 'launched', fields: {} }
const count = async (sql: string, ...binds: unknown[]) => ((await dbs.waitlist.prepare(sql).bind(...binds).first<{ n: number }>())?.n ?? 0)

describe('announcement templates', () => {
  it('offers the three templates, each with subject, title, body and a button', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['open', 'progress', 'launched'])
    for (const t of TEMPLATES) {
      expect(t.fields.map((f) => f.key)).toEqual(expect.arrayContaining(['subject', 'title', 'body', 'buttonLabel', 'buttonUrl']))
      for (const f of t.fields) expect(f.max).toBeGreaterThan(0)
    }
  })

  it('writes the launch email from the example: subject, ready line, pitch, self-host line, signed Nathan', () => {
    const fields = defaultFields(feelium, 'launched')
    expect(fields.subject).toBe('Feelium is open, and your early spot is ready')
    const { html, text, subject } = renderAnnouncement(feelium, 'launched', { ...fields, perk: 'Early sign-ups get Pro free for a year.' }, 'https://n8builds.dev/upcoming/leave?t=abc')
    expect(subject).toBe(fields.subject)
    expect(text).toContain("You joined the waitlist for Feelium, and it's ready.")
    expect(text).toContain(feelium.summary)
    expect(text).toContain('Early sign-ups get Pro free for a year.')
    expect(text).toContain('Rather self-host? It stays free and open source. https://github.com/n8watkins/feelium')
    expect(text).toMatch(/\nNathan\n/)
    expect(text).toContain('Manage or leave the waitlist: https://n8builds.dev/upcoming/leave?t=abc')
    expect(html).toContain('https://n8builds.dev/email/logo.png')
    expect(html).toContain('https://n8builds.dev/email/upcoming/feelium.png')
    expect(html).toContain('href="https://n8builds.dev/upcoming/leave?t=abc"')
    expect(html).toContain('href="https://github.com/n8watkins/feelium"')
  })

  it('leaves out the perk and self-host lines when they are empty', () => {
    const fields = { ...defaultFields(feelium, 'launched'), perk: '', selfHost: '' }
    const { html, text } = renderAnnouncement(feelium, 'launched', fields, PREVIEW_MANAGE_URL)
    expect(text).not.toContain('self-host')
    expect(html).not.toContain('github.com/n8watkins/feelium')
  })

  it('escapes every field and keeps paragraphs', () => {
    const fields = resolveFields(feelium, 'open', { title: '<b>Hi</b>', body: 'One <script>\n\nTwo' })
    const { html } = renderAnnouncement(feelium, 'open', fields, PREVIEW_MANAGE_URL)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;b&gt;Hi&lt;/b&gt;')
    expect(html).toContain('One &lt;script&gt;</p>')
  })

  it('refuses a too-long field, an empty required one and a non-https button', () => {
    expect(() => resolveFields(feelium, 'open', { subject: 'x'.repeat(121) })).toThrow(InvalidAnnouncement)
    expect(() => resolveFields(feelium, 'open', { title: '' })).toThrow(/required/)
    expect(() => resolveFields(feelium, 'open', { buttonUrl: 'javascript:alert(1)' })).toThrow(/https/)
    expect(() => resolveFields(feelium, 'open', { subject: 'two\nlines' })).toThrow(/one line/)
  })

  it('previews with the placeholder manage link and the number of people it would reach', async () => {
    const { service, people } = setup()
    await people(3)
    const preview = await service.preview({ project: 'feelium', template: 'open', fields: { subject: 'Hello' } })
    expect(preview).toMatchObject({ subject: 'Hello', recipients: 3 })
    expect(preview.html).toContain(PREVIEW_MANAGE_URL)
    expect(preview.fields.title).toBe('Feelium: early access is open')
  })
})

describe('Announcements: start', () => {
  it('snapshots the confirmed people at start: later sign-ups and unconfirmed ones are left out', async () => {
    const { service, people, waitlist, fake } = setup()
    await people(3)
    await waitlist.join({ email: 'pending@example.com', projects: ['feelium'], note: '', interest: '', referrer: '' })
    await people(2, 'fitflow7', 's')
    const result = await service.start(launch, 'owner')
    if (!('id' in result)) throw new Error('expected a start')
    expect(await service.status(result.id)).toMatchObject({ project: 'feelium', total: 3, sent: 0, state: 'sending', createdBy: 'owner' })

    await people(2, 'feelium', 'late')
    await service.run()
    expect(fake.delivered.map((m) => m.to).sort()).toEqual(['p0@example.com', 'p1@example.com', 'p2@example.com'])
    expect(await service.status(result.id)).toMatchObject({ total: 3, sent: 3, skipped: 0, state: 'done', nextRunAt: null })
  })

  it('allows one announcement per project every 30 days', async () => {
    const { service, people, later } = setup()
    await people(1)
    await people(1, 'fitflow7', 's')
    expect(await service.start(launch, 'owner')).toHaveProperty('id')
    later(29 * DAY)
    expect(await service.start({ ...launch, template: 'open' }, 'owner')).toEqual({
      error: 'too_soon',
      nextAllowedAt: new Date(T0.getTime() + 30 * DAY).toISOString(),
    })
    // Another project is unaffected.
    expect(await service.start({ ...launch, project: 'fitflow7' }, 'owner')).toHaveProperty('id')
    later(DAY + 1)
    expect(await service.start({ ...launch, template: 'open' }, 'owner')).toHaveProperty('id')
  })

  it('lets a cancelled announcement that sent nothing not count toward the 30 days', async () => {
    const { service, people } = setup()
    await people(1)
    const first = await service.start(launch, 'owner')
    if (!('id' in first)) throw new Error()
    await service.cancel(first.id, 'owner')
    expect(await service.start(launch, 'owner')).toHaveProperty('id')
  })

  it('refuses a project with no one confirmed, an unknown project or template, and an unfilled placeholder', async () => {
    const { service, people } = setup()
    expect(await service.start(launch, 'owner')).toEqual({ error: 'no_recipients' })
    await people(1)
    await expect(service.start({ ...launch, project: 'nope' }, 'owner')).rejects.toThrow(/unknown project/)
    await expect(service.start({ ...launch, template: 'nope' }, 'owner')).rejects.toThrow(/unknown template/)
    await expect(service.start({ ...launch, template: 'progress' }, 'owner')).rejects.toThrow(/placeholder/)
    await expect(service.start(launch, '')).rejects.toThrow(/actor/)
  })

  it('has nothing to do with a project that left the site: not listed, and no preview, test send or start', async () => {
    const { service, people, fake } = setup()
    const [id] = await people(1)
    // Someone confirmed on Strollz before it left /upcoming (2026-11-11): the row is still there.
    await dbs.waitlist.prepare("UPDATE waitlist_projects SET project = 'strollz' WHERE subscriber_id = ?").bind(id).run()
    expect((await service.projects()).map((p) => p.slug)).toEqual(UPCOMING.map((p) => p.slug))
    for (const project of ['strollz', 'keysready', 'vibelog', 'asset-arsenal']) {
      const request = { ...launch, project }
      await expect(service.preview(request), project).rejects.toThrow(/unknown project/)
      await expect(service.sendTest(request, 'owner'), project).rejects.toThrow(/unknown project/)
      await expect(service.start(request, 'owner'), project).rejects.toThrow(/unknown project/)
    }
    await service.run()
    expect(fake.calls()).toBe(0)
    expect(await count('SELECT COUNT(*) AS n FROM waitlist_announcements')).toBe(0)
    expect(await count("SELECT COUNT(*) AS n FROM waitlist_projects WHERE project = 'strollz' AND status = 'confirmed'")).toBe(1)
  })

  it('reports projects with their confirmed counts and last announcement', async () => {
    const { service, people } = setup()
    await people(2)
    await service.start(launch, 'owner')
    const projects = await service.projects()
    expect(projects).toHaveLength(UPCOMING.length)
    expect(projects.find((p) => p.slug === 'feelium')).toEqual({ slug: 'feelium', name: 'Feelium', confirmed: 2, lastAnnouncedAt: T0.toISOString() })
    expect(projects.find((p) => p.slug === 'fitflow7')).toMatchObject({ confirmed: 0, lastAnnouncedAt: null })
  })
})

describe('Announcements: sending', () => {
  it('sends in batches up to the run limit and resumes on the next run without sending anyone twice', async () => {
    const { service, people, fake, later } = setup()
    await people(RUN_LIMIT + 5)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()

    const [first] = await service.run()
    expect(first).toMatchObject({ sent: RUN_LIMIT, state: 'sending' })
    const status = (await service.status(start.id))!
    expect(status).toMatchObject({ sent: RUN_LIMIT, state: 'sending' })
    expect(status.nextRunAt).toBe('2026-11-02T10:15:00.000Z')

    // Not due yet.
    expect(await service.run()).toEqual([])
    later(15 * 60 * 1000)
    // Even a mailroom that forgot its keys gets no repeat: the database records each send.
    fake.forgetKeys()
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ sent: RUN_LIMIT + 5, state: 'done' })
    const to = fake.delivered.map((m) => m.to)
    expect(new Set(to).size).toBe(to.length)
    expect(to).toHaveLength(RUN_LIMIT + 5)
  })

  it('gives every email its own manage link and the per-recipient idempotency key', async () => {
    const { service, people, fake } = setup()
    const ids = await people(2)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    await service.run()
    expect(fake.delivered.map((m) => m.key).sort()).toEqual(ids.map((id) => `announce:${start.id}:${id}`).sort())
    for (const mail of fake.delivered) {
      expect(mail.kind).toBe('announce')
      const token = new URL(mail.text.match(/Manage or leave the waitlist: (\S+)/)![1]).searchParams.get('t')!
      expect(mail.html).toContain(`/upcoming/leave?t=${token}`)
      expect(mail.headers['List-Unsubscribe']).toContain(token)
      // The link works: it belongs to this person.
      const row = await dbs.waitlist.prepare("SELECT subscriber_id FROM waitlist_tokens WHERE token_hash = ? AND purpose = 'leave'").bind(tokenHash(token)).first<{ subscriber_id: string }>()
      expect(ids).toContain(row?.subscriber_id)
    }
  })

  it('treats a duplicate from mailroom as sent, so a lost record is never sent again', async () => {
    const { service, people, fake } = setup()
    await people(2)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    await service.run()
    // As if recording the sends had failed: they are pending again.
    await dbs.waitlist.prepare("UPDATE waitlist_announcement_recipients SET status = 'pending'").run()
    await dbs.waitlist.prepare("UPDATE waitlist_announcements SET state = 'sending', sent = 0, next_run_at = NULL").run()
    const before = await count("SELECT COUNT(*) AS n FROM waitlist_tokens WHERE purpose = 'leave'")
    await service.run()
    expect(fake.delivered).toHaveLength(2)
    expect(fake.calls()).toBe(4)
    expect(await service.status(start.id)).toMatchObject({ sent: 2, state: 'done' })
    // The links made for the duplicates are thrown away.
    expect(await count("SELECT COUNT(*) AS n FROM waitlist_tokens WHERE purpose = 'leave'")).toBe(before)
  })

  it('pauses at a cap refusal, never retries past it in that run, and resumes the next day', async () => {
    const { service, people, fake, later } = setup()
    await people(5)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    fake.refuse(2, 'cap_app_day')
    const [report] = await service.run()
    expect(report).toMatchObject({ sent: 2, state: 'paused_cap', stoppedAt: 'cap_app_day' })
    expect(fake.calls()).toBe(3)
    expect(await service.status(start.id)).toMatchObject({
      sent: 2,
      state: 'paused_cap',
      lastError: 'cap_app_day',
      nextRunAt: '2026-11-03T00:00:00.000Z',
    })
    // No leave link left behind for the refused email.
    expect(await count("SELECT COUNT(*) AS n FROM waitlist_tokens WHERE purpose = 'leave'")).toBe(5 + 2)

    // A run before then does nothing at all.
    later(60 * 60 * 1000)
    expect(await service.run()).toEqual([])
    expect(fake.calls()).toBe(3)

    fake.allow()
    later(DAY)
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ sent: 5, state: 'done', lastError: null })
    expect(fake.delivered).toHaveLength(5)
  })

  it('pauses on any other refusal or error too, and tries again on the next run', async () => {
    const { service, people, fake, later } = setup()
    await people(2)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    fake.refuse(0, 'rate_limited')
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ state: 'paused_cap', lastError: 'rate_limited', nextRunAt: '2026-11-02T10:15:00.000Z' })
    fake.allow()
    later(15 * 60 * 1000)
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ state: 'done', sent: 2 })
  })

  it('counts a suppressed address as failed and carries on with the rest', async () => {
    const { service, people, fake } = setup()
    await people(3)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    fake.refuse(0, 'suppressed')
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ state: 'done', sent: 0, failed: 3, skipped: 0 })
  })

  it('skips someone who left the project or the waitlist after the start', async () => {
    const { service, people, waitlist, fake } = setup()
    const ids = await people(3)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    await waitlist.remove(ids[0])
    // Moves the second person to another project only.
    await dbs.waitlist.prepare("UPDATE waitlist_projects SET project = 'fitflow7' WHERE subscriber_id = ?").bind(ids[1]).run()
    await service.run()
    expect(fake.delivered).toHaveLength(1)
    expect(await service.status(start.id)).toMatchObject({ total: 3, sent: 1, skipped: 2, state: 'done' })
  })

  it('keeps inside its daily budget of the n8builds-web slice', async () => {
    const { service, people, later } = setup()
    await people(DAY_BUDGET + 5)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    for (let i = 0; i < 4; i++) {
      await service.run()
      later(15 * 60 * 1000)
    }
    expect(await service.status(start.id)).toMatchObject({ sent: DAY_BUDGET, state: 'paused_cap', lastError: 'budget_day', nextRunAt: '2026-11-03T00:00:00.000Z' })
    later(DAY)
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ sent: DAY_BUDGET + 5, state: 'done' })
  }, 30_000)

  it('cancel stops the rest: no one else gets it, and the rest count as skipped', async () => {
    const { service, people, fake, later } = setup()
    await people(RUN_LIMIT + 3)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    await service.run()
    expect(await service.cancel(start.id, 'owner')).toMatchObject({ state: 'cancelled', sent: RUN_LIMIT, skipped: 3, nextRunAt: null })
    later(15 * 60 * 1000)
    expect(await service.run()).toEqual([])
    expect(fake.delivered).toHaveLength(RUN_LIMIT)
    // Cancelling a finished one changes nothing.
    expect(await service.cancel(start.id, 'owner')).toMatchObject({ state: 'cancelled', sent: RUN_LIMIT })
    expect(await service.cancel('0'.repeat(32), 'owner')).toBeNull()
  })

  it('lists the newest first, with the same fields as status', async () => {
    const { service, people, later } = setup()
    await people(1)
    await people(1, 'fitflow7', 's')
    const a = await service.start(launch, 'owner')
    later(1000)
    const b = await service.start({ ...launch, project: 'fitflow7' }, 'owner')
    const list = await service.list({ limit: 10 })
    expect(list.map((x) => x.id)).toEqual([(b as { id: string }).id, (a as { id: string }).id])
    expect(list[0]).toEqual(await service.status((b as { id: string }).id))
  })
})

describe('Announcements: test sends and the audit log', () => {
  it('sends a test to the owner only, and writes start, cancel and test to the audit log', async () => {
    const { service, people, fake } = setup()
    await people(2)
    const result: SendResult = await service.sendTest(launch, 'n8watkins')
    expect(result.ok).toBe(true)
    expect(fake.delivered).toHaveLength(1)
    expect(fake.delivered[0]).toMatchObject({ to: OWNER, kind: 'announce', subject: '[Test] Feelium is open, and your early spot is ready' })
    expect(fake.delivered[0].html).toContain(PREVIEW_MANAGE_URL)

    const start = await service.start(launch, 'n8watkins')
    if (!('id' in start)) throw new Error()
    await service.cancel(start.id, 'n8watkins')
    const { results } = await dbs.waitlist
      .prepare('SELECT actor, action, announcement_id, project FROM waitlist_announcement_audit ORDER BY id')
      .all<Record<string, unknown>>()
    expect(results).toEqual([
      { actor: 'n8watkins', action: 'test', announcement_id: null, project: 'feelium' },
      { actor: 'n8watkins', action: 'start', announcement_id: start.id, project: 'feelium' },
      { actor: 'n8watkins', action: 'cancel', announcement_id: start.id, project: 'feelium' },
    ])
  })

  it('fails closed without a mailroom binding', async () => {
    const service = new Announcements({ db: dbs.waitlist, mailroom: undefined, ownerEmail: OWNER })
    expect(await service.sendTest(launch, 'owner')).toMatchObject({ ok: false, code: 'not_configured' })
  })

  it('the daily cleanup drops who had an announcement 30 days after it finished, keeping its counts', async () => {
    const { service, people } = setup()
    await people(2)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()
    await service.run()
    await purgeExpired({ waitlist: dbs.waitlist }, new Date(T0.getTime() + 29 * DAY))
    expect(await count('SELECT COUNT(*) AS n FROM waitlist_announcement_recipients')).toBe(2)
    await purgeExpired({ waitlist: dbs.waitlist }, new Date(T0.getTime() + 31 * DAY))
    expect(await count('SELECT COUNT(*) AS n FROM waitlist_announcement_recipients')).toBe(0)
    expect(await service.status(start.id)).toMatchObject({ sent: 2, state: 'done' })
  })
})

describe('Announcements: integration with a fake mailroom', () => {
  it('runs start to done across cron runs, and the manage link in each email works', async () => {
    const { service, people, fake, waitlist, later } = setup()
    const ids = await people(RUN_LIMIT + 4)
    const start = await service.start(launch, 'owner')
    if (!('id' in start)) throw new Error()

    // First run: the cap refuses part way.
    fake.refuse(RUN_LIMIT - 5)
    await service.run()
    expect(await service.status(start.id)).toMatchObject({ state: 'paused_cap', sent: RUN_LIMIT - 5 })

    // Someone follows the manage link in their email and leaves the whole waitlist.
    const link = new URL(fake.delivered[0].text.match(/Manage or leave the waitlist: (\S+)/)![1])
    expect(link.pathname).toBe('/upcoming/leave')
    const entry = await waitlist.forLeaveToken(link.searchParams.get('t')!)
    expect(entry?.email).toBe(fake.delivered[0].to)
    // And someone not yet sent to leaves too.
    const pending = ids.find((id) => !fake.delivered.some((m) => m.key.endsWith(id)))!
    await waitlist.remove(pending)
    await waitlist.leave(link.searchParams.get('t')!)

    fake.allow()
    later(DAY)
    await service.run()
    later(15 * 60 * 1000)
    await service.run()
    const status = (await service.status(start.id))!
    expect(status).toMatchObject({ state: 'done', total: RUN_LIMIT + 4, sent: RUN_LIMIT + 3, failed: 0, skipped: 1, nextRunAt: null })
    expect(new Set(fake.delivered.map((m) => m.to)).size).toBe(fake.delivered.length)
    expect((await service.list({ limit: 1 }))[0]).toEqual(status)
  }, 30_000)
})
