import { describe, expect, it, vi } from 'vitest'
import { PENDING_DAYS, RedisWaitlistStore, fromFields, toFields, type WaitlistEntry } from '@/lib/waitlist/store'
import { cleanReferrer } from '@/lib/waitlist/schema'
import { confirmUrl, createConfirmHtml, createConfirmText, createLeaveHtml, leaveUrl, projectList } from '@/lib/email/waitlist'

const entry: WaitlistEntry = {
  id: 'abc',
  email: 'visitor@example.com',
  projects: [],
  requested: ['relink', 'strollz'],
  note: '',
  requestedNote: '42',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  confirmedAt: '',
  interest: 'relink',
  referrer: '',
  token: 'tok_abcdefghijklmnopqrstuvwxyz',
}

/** A stand-in for Upstash's multi(): records each command in order. */
function fakeRedis() {
  const commands: unknown[][] = []
  const tx = new Proxy({} as Record<string, unknown>, {
    get: (_, name: string) => (name === 'exec' ? async () => [] : (...args: unknown[]) => commands.push([name, ...args])),
  })
  return { commands, redis: { multi: () => tx, hgetall: vi.fn(), get: vi.fn() } }
}

describe('RedisWaitlistStore', () => {
  it('writes an unconfirmed entry with an expiry', async () => {
    const { commands, redis } = fakeRedis()
    await new RedisWaitlistStore(redis as never).save(entry)
    const seconds = PENDING_DAYS * 86_400
    expect(commands).toEqual([
      ['hset', 'waitlist:entry:abc', toFields(entry)],
      ['set', 'waitlist:token:tok_abcdefghijklmnopqrstuvwxyz', 'abc'],
      ['zadd', 'waitlist:all', { score: Date.parse(entry.createdAt), member: 'abc' }],
      ['expire', 'waitlist:entry:abc', seconds],
      ['expire', 'waitlist:token:tok_abcdefghijklmnopqrstuvwxyz', seconds],
    ])
  })

  it('keeps a confirmed entry for good, under its namespace', async () => {
    const { commands, redis } = fakeRedis()
    await new RedisWaitlistStore(redis as never, 'waitlist:preview').save({ ...entry, confirmedAt: '2026-11-01T11:00:00.000Z' })
    expect(commands.slice(3)).toEqual([
      ['persist', 'waitlist:preview:entry:abc'],
      ['persist', 'waitlist:preview:token:tok_abcdefghijklmnopqrstuvwxyz'],
    ])
  })

  it('deletes all three keys when someone leaves', async () => {
    const { commands, redis } = fakeRedis()
    await new RedisWaitlistStore(redis as never).remove(entry)
    expect(commands).toEqual([
      ['del', 'waitlist:entry:abc', 'waitlist:token:tok_abcdefghijklmnopqrstuvwxyz'],
      ['zrem', 'waitlist:all', 'abc'],
    ])
  })

  it('round-trips an entry through its hash fields, notes that look like numbers included', () => {
    expect(fromFields('abc', toFields(entry))).toEqual(entry)
    expect(fromFields('abc', null)).toBeNull()
    expect(fromFields('abc', { email: 'a@b.co' })).toBeNull()
  })

  it('ignores unknown projects in stored fields', () => {
    expect(fromFields('abc', { ...toFields(entry), projects: 'relink,bogus' })?.projects).toEqual(['relink'])
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

describe('waitlist emails', () => {
  it('link to the confirm and leave pages with the token', () => {
    const html = createConfirmHtml(entry)
    expect(html).toContain(confirmUrl(entry.token))
    expect(html).toContain(leaveUrl(entry.token))
    expect(confirmUrl(entry.token)).toBe('https://n8builds.dev/upcoming/confirm?t=tok_abcdefghijklmnopqrstuvwxyz')
    expect(createConfirmText(entry)).toContain(leaveUrl(entry.token))
    expect(createLeaveHtml(entry)).toContain(leaveUrl(entry.token))
  })

  it("never repeat the visitor's note", () => {
    const withNote = { ...entry, requestedNote: 'Visit https://scam.example now' }
    expect(createConfirmHtml(withNote)).not.toContain('scam.example')
    expect(createConfirmText(withNote)).not.toContain('scam.example')
  })

  it('name the projects asked for', () => {
    expect(projectList(['relink'])).toBe('Relink')
    expect(projectList(['relink', 'strollz'])).toBe('Relink and Strollz')
    expect(projectList(['vibelog', 'relink', 'strollz'])).toBe('Relink, Strollz and VibeLog')
    expect(createConfirmHtml(entry)).toContain('Relink and Strollz')
  })
})
