import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONFIRM_DAYS, NewsletterStore } from '@/lib/newsletter/store'
import { DIGEST_MONTH_BUDGET, RUN_LIMIT, runDigest } from '@/lib/newsletter/digest'
import type { NewsEmail, NewsSendResult } from '@/lib/newsletter/mail'
import type { DigestPost } from '@/lib/newsletter/emails'
import {
  createConfirmHtml,
  createConfirmText,
  createDigestHtml,
  createDigestText,
  digestSubject,
  unsubscribeHeaders,
} from '@/lib/newsletter/emails'
import { WaitlistStore } from '@/lib/waitlist/store'
import { purgeExpired } from '@/lib/retention'
import { testDatabases, type TestDatabases } from './d1'

const DAY = 86_400_000
const T0 = new Date('2026-11-02T10:00:00.000Z')

let dbs: TestDatabases
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())
beforeEach(() => dbs.reset())

/** A store whose clock the test moves. */
function clock(start = T0) {
  let now = start
  const at = () => now
  return { at, store: new NewsletterStore(dbs.waitlist, at), later: (ms: number) => (now = new Date(now.getTime() + ms)) }
}

const count = async (sql: string) => ((await dbs.waitlist.prepare(sql).first<{ n: number }>())?.n ?? 0)

async function confirmed(store: NewsletterStore, email: string) {
  const result = await store.subscribe(email)
  if (result.status !== 'pending') throw new Error('expected a pending sign-up')
  return (await store.confirm(result.confirmToken))!
}

describe('NewsletterStore: double opt-in', () => {
  it('saves a sign-up unconfirmed, with a confirm link that expires in 7 days', async () => {
    const { store } = clock()
    const result = await store.subscribe('reader@example.com')
    expect(result.status).toBe('pending')
    const row = await dbs.waitlist.prepare('SELECT * FROM newsletter_subscribers').first<Record<string, unknown>>()
    expect(row).toMatchObject({ email: 'reader@example.com', confirmed_at: null, expires_at: T0.getTime() + CONFIRM_DAYS * DAY })
    // Only the token's hash is stored.
    if (result.status === 'pending') expect(JSON.stringify(row)).not.toContain(result.confirmToken)
  })

  it('confirms once: the link is single-use', async () => {
    const { store } = clock()
    const result = await store.subscribe('reader@example.com')
    if (result.status !== 'pending') throw new Error()
    const subscriber = await store.confirm(result.confirmToken)
    expect(subscriber).toMatchObject({ email: 'reader@example.com', confirmedAt: T0.toISOString() })
    expect(await store.confirm(result.confirmToken)).toBeNull()
    expect(await count('SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE confirm_hash IS NULL AND expires_at IS NULL')).toBe(1)
  })

  it('refuses a confirm link after 7 days, and the cleanup deletes the unconfirmed row', async () => {
    const { store, later, at } = clock()
    const result = await store.subscribe('reader@example.com')
    if (result.status !== 'pending') throw new Error()
    later(CONFIRM_DAYS * DAY)
    expect(await store.confirm(result.confirmToken)).toBeNull()
    await purgeExpired({ waitlist: dbs.waitlist }, at())
    expect(await count('SELECT COUNT(*) AS n FROM newsletter_subscribers')).toBe(0)
  })

  it('a second sign-up replaces the confirm link, and an expired row starts over', async () => {
    const { store, later } = clock()
    const first = await store.subscribe('reader@example.com')
    const second = await store.subscribe('reader@example.com')
    if (first.status !== 'pending' || second.status !== 'pending') throw new Error()
    expect(await store.confirm(first.confirmToken)).toBeNull()
    later(CONFIRM_DAYS * DAY + 1)
    const third = await store.subscribe('reader@example.com')
    expect(third.status).toBe('pending')
    if (third.status === 'pending') expect(await store.confirm(third.confirmToken)).not.toBeNull()
  })

  it('leaves a confirmed address as it is: no new link, same unsubscribe token', async () => {
    const { store } = clock()
    const subscriber = await confirmed(store, 'reader@example.com')
    const again = await store.subscribe('reader@example.com')
    expect(again.status).toBe('confirmed')
    expect(again.subscriber.unsubscribeToken).toBe(subscriber.unsubscribeToken)
    expect(again.subscriber.confirmedAt).toBe(subscriber.confirmedAt)
  })

  it('unsubscribing deletes the row, pending or confirmed, and never touches the waitlist', async () => {
    const { store } = clock()
    const waitlist = new WaitlistStore(dbs.waitlist, () => T0)
    await waitlist.join({ email: 'reader@example.com', projects: ['feelium'], note: '', interest: '', referrer: '' })
    const subscriber = await confirmed(store, 'reader@example.com')
    const pending = await store.subscribe('other@example.com')

    expect(await store.unsubscribe(subscriber.unsubscribeToken)).toBe(true)
    expect(await store.unsubscribe(subscriber.unsubscribeToken)).toBe(false)
    expect(await store.unsubscribe(pending.subscriber.unsubscribeToken)).toBe(true)
    expect(await count('SELECT COUNT(*) AS n FROM newsletter_subscribers')).toBe(0)
    expect(await count('SELECT COUNT(*) AS n FROM waitlist_subscribers')).toBe(1)
  })
})

describe('newsletter emails', () => {
  const posts: DigestPost[] = [
    { title: 'Shipping <fast>', slug: 'shipping-fast', publishedAt: '2026-11-05T12:00:00Z', excerpt: 'How & why.' },
    { title: 'Second', slug: 'second', publishedAt: '2026-11-06T12:00:00Z', excerpt: '' },
  ]

  it('carry the confirm link, the unsubscribe link and the one-click headers', () => {
    expect(createConfirmText('c'.repeat(32), 'u'.repeat(32))).toContain(`https://n8builds.dev/newsletter/confirm?t=${'c'.repeat(32)}`)
    expect(createConfirmHtml('c'.repeat(32), 'u'.repeat(32))).toContain(`https://n8builds.dev/newsletter/unsubscribe?t=${'u'.repeat(32)}`)
    expect(unsubscribeHeaders('u'.repeat(32))).toEqual({
      'List-Unsubscribe': `<https://n8builds.dev/api/newsletter/unsubscribe?t=${'u'.repeat(32)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
  })

  it('list every post in the digest, escaped', () => {
    expect(digestSubject(posts)).toBe("2 new posts on N8's Notions")
    expect(digestSubject(posts.slice(0, 1))).toBe("New on N8's Notions: Shipping <fast>")
    const html = createDigestHtml(posts, 'u'.repeat(32))
    expect(html).toContain('Shipping &lt;fast&gt;')
    expect(html).toContain('https://n8builds.dev/blog/second')
    expect(html).toContain('newsletter/unsubscribe?t=')
    expect(createDigestText(posts, 'u'.repeat(32))).toContain('https://n8builds.dev/blog/shipping-fast')
  })
})

describe('runDigest: selection and sending', () => {
  const post = (publishedAt: string, slug = 'p'): DigestPost => ({ title: `Post ${slug}`, slug, publishedAt, excerpt: '' })

  /** A mailer that records sends, and refuses with `refuse(n)` from the nth send on. */
  function mailer() {
    const sent: NewsEmail[] = []
    let refuseAt = Infinity
    let code = 'cap_app_day'
    const mail = vi.fn(async (email: NewsEmail): Promise<NewsSendResult> => {
      if (sent.length + 1 >= refuseAt) return { ok: false, code }
      sent.push(email)
      return { ok: true }
    })
    return { sent, mail, refuse: (n: number, c = 'cap_app_day') => ((refuseAt = n), (code = c)), allow: () => (refuseAt = Infinity) }
  }

  async function subscribers(store: NewsletterStore, n: number) {
    for (let i = 0; i < n; i++) await confirmed(store, `reader${i}@example.com`)
  }

  it('sends nothing in a week without a new post', async () => {
    const { store, at } = clock()
    await subscribers(store, 2)
    const { mail, sent } = mailer()
    const posts = vi.fn(async () => [])
    expect(await runDigest({ store, mail, posts, now: at }, { start: true })).toEqual({ action: 'no-posts' })
    expect(sent).toHaveLength(0)
    expect(await count('SELECT COUNT(*) AS n FROM newsletter_digests')).toBe(0)
  })

  it('sends the new posts to confirmed subscribers only, with their own unsubscribe link and key', async () => {
    const { store, at } = clock()
    await subscribers(store, 2)
    await store.subscribe('pending@example.com')
    const { mail, sent } = mailer()
    const posts = vi.fn(async () => [post('2026-11-01T09:00:00Z')])
    const report = await runDigest({ store, mail, posts, now: at }, { start: true })
    expect(report).toMatchObject({ action: 'sent', sent: 2 })
    expect(sent.map((e) => e.to).sort()).toEqual(['reader0@example.com', 'reader1@example.com'])
    for (const email of sent) {
      expect(email.kind).toBe('digest')
      expect(email.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
      expect(email.key).toMatch(/^digest-\d+-[0-9a-f]{32}$/)
    }
    // The first digest looks back a week.
    expect(posts).toHaveBeenCalledWith(new Date(T0.getTime() - 7 * DAY).toISOString(), T0.toISOString())
  })

  it('the next digest takes only the posts since the last one, and nothing on the daily run', async () => {
    const { store, at, later } = clock()
    await subscribers(store, 1)
    const { mail } = mailer()
    const posts = vi.fn(async () => [post('2026-11-01T09:00:00Z')])
    await runDigest({ store, mail, posts, now: at }, { start: true })
    later(DAY)
    expect(await runDigest({ store, mail, posts, now: at }, { start: false })).toEqual({ action: 'idle' })
    later(6 * DAY)
    await runDigest({ store, mail, posts, now: at }, { start: true })
    expect(posts).toHaveBeenLastCalledWith(T0.toISOString(), at().toISOString())
  })

  it('stops at the first refusal, never retries past it, and resumes on the next run', async () => {
    const { store, at, later } = clock()
    await subscribers(store, 5)
    const m = mailer()
    m.refuse(3)
    const posts = vi.fn(async () => [post('2026-11-01T09:00:00Z')])
    const first = await runDigest({ store, mail: m.mail, posts, now: at }, { start: true })
    expect(first).toMatchObject({ action: 'stopped', sent: 2, code: 'cap_app_day' })
    expect(m.mail).toHaveBeenCalledTimes(3)
    expect(await count("SELECT COUNT(*) AS n FROM newsletter_digests WHERE status = 'sending' AND note LIKE '%cap_app_day%'")).toBe(1)

    m.allow()
    later(DAY)
    const second = await runDigest({ store, mail: m.mail, posts, now: at }, { start: false })
    expect(second).toMatchObject({ action: 'sent', sent: 3 })
    expect(new Set(m.sent.map((e) => e.to)).size).toBe(5)
    expect(m.sent).toHaveLength(5)
  })

  it('deletes an address mailroom has suppressed, and goes on', async () => {
    const { store, at } = clock()
    await subscribers(store, 3)
    const m = mailer()
    m.refuse(1, 'suppressed')
    const mail = vi.fn(async (email: NewsEmail) => {
      const result = await m.mail(email)
      m.allow()
      return result
    })
    const report = await runDigest({ store, mail, posts: async () => [post('2026-11-01T09:00:00Z')], now: at }, { start: true })
    expect(report).toMatchObject({ action: 'sent', sent: 2, removed: 1 })
    expect(await count('SELECT COUNT(*) AS n FROM newsletter_subscribers')).toBe(2)
  })

  it(`sends at most ${RUN_LIMIT} a run, in batches`, async () => {
    const { store, at } = clock()
    await subscribers(store, RUN_LIMIT + 3)
    const m = mailer()
    const report = await runDigest({ store, mail: m.mail, posts: async () => [post('2026-11-01T09:00:00Z')], now: at }, { start: true })
    expect(report).toMatchObject({ action: 'paused', sent: RUN_LIMIT })
    expect(await runDigest({ store, mail: m.mail, posts: async () => [], now: at }, { start: false })).toMatchObject({ action: 'sent', sent: 3 })
  })

  it("skips a week that would take the month's digests past the budget, and keeps its posts for later", async () => {
    const { store, at, later } = clock()
    const perDigest = Math.floor(DIGEST_MONTH_BUDGET / 2) + 1
    // Seed what was already sent this month instead of sending it.
    await dbs.waitlist
      .prepare("INSERT INTO newsletter_digests (created_at, posts_since, posts, status, recipients, finished_at) VALUES (?, ?, '[]', 'sent', ?, ?)")
      .bind(T0.toISOString(), T0.toISOString(), perDigest, T0.toISOString())
      .run()
    await subscribers(store, 1)
    await dbs.waitlist.prepare('UPDATE newsletter_digests SET recipients = ?').bind(DIGEST_MONTH_BUDGET).run()
    later(7 * DAY)
    const m = mailer()
    const posts = vi.fn(async () => [post('2026-11-05T09:00:00Z')])
    const report = await runDigest({ store, mail: m.mail, posts, now: at }, { start: true })
    expect(report).toMatchObject({ action: 'skipped' })
    expect(m.sent).toHaveLength(0)
    expect(await count("SELECT COUNT(*) AS n FROM newsletter_digests WHERE status = 'skipped' AND note LIKE 'Skipped:%'")).toBe(1)

    // A new month: the skipped week's posts go out, since the last digest that went.
    later(30 * DAY)
    expect(await runDigest({ store, mail: m.mail, posts, now: at }, { start: true })).toMatchObject({ action: 'sent', sent: 1 })
    expect(posts).toHaveBeenLastCalledWith(T0.toISOString(), at().toISOString())
  })
})
