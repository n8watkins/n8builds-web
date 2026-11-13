/**
 * A stand-in for Kit's V4 API, in memory: the unit tests drive the Kit client
 * against it, and in CONTACT_TEST_MODE (which every deployed Worker ignores)
 * the site uses it instead of Kit, so the E2E tests can sign up without
 * anything leaving the machine. /api/test/kit reads what it holds.
 *
 * It keeps only what the site uses: subscribers (state, tags, forms), tags
 * and one double opt-in form (id 4242). An address at kit-down.example gets a
 * 503, for the "Kit is down" paths.
 */

export const FAKE_FORM_ID = '4242'
export const KIT_DOWN_DOMAIN = 'kit-down.example'

export type FakeSubscriber = { email: string; state: 'inactive' | 'active'; tags: string[]; forms: string[]; referrer: string | null }
export type FakeCall = { method: string; path: string }

export type FakeKit = {
  fetch: typeof globalThis.fetch
  calls: FakeCall[]
  subscriber(email: string): FakeSubscriber | null
  tags(): { id: string; name: string }[]
  /** Kit's confirm link being clicked. */
  confirm(email: string): void
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export function fakeKit({ forms = [{ id: FAKE_FORM_ID, name: 'n8builds' }] }: { forms?: { id: string; name: string }[] } = {}): FakeKit {
  const subscribers = new Map<string, { state: 'inactive' | 'active'; tags: Set<string>; forms: Set<string>; referrer: string | null }>()
  const tags = new Map<string, string>() // id -> name
  let nextId = 100
  const calls: FakeCall[] = []

  const handle = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    const method = (init?.method ?? 'GET').toUpperCase()
    const path = url.pathname.replace(/^\/v4/, '')
    calls.push({ method, path: path + url.search })
    const headers = new Headers(init?.headers)
    if (!headers.get('X-Kit-Api-Key')) return json(401, { errors: ['The access token is invalid'] })
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
    const email = typeof body.email_address === 'string' ? body.email_address : ''
    if (email.endsWith(`@${KIT_DOWN_DOMAIN}`)) return json(503, { errors: ['Service unavailable'] })

    if (method === 'POST' && path === '/subscribers') {
      if (!email.includes('@')) return json(422, { errors: ['Email address is invalid'] })
      const existing = subscribers.get(email)
      if (!existing) subscribers.set(email, { state: 'inactive', tags: new Set(), forms: new Set(), referrer: null })
      return json(existing ? 200 : 201, { subscriber: { id: 1, email_address: email, state: (existing ?? subscribers.get(email))!.state } })
    }
    if (method === 'GET' && path === '/tags') {
      return json(200, { tags: [...tags].map(([id, name]) => ({ id: Number(id), name })), pagination: { has_next_page: false, end_cursor: null } })
    }
    if (method === 'POST' && path === '/tags') {
      const name = String(body.name ?? '')
      const found = [...tags].find(([, n]) => n === name)
      if (found) return json(200, { tag: { id: Number(found[0]), name } })
      const id = String(nextId++)
      tags.set(id, name)
      return json(201, { tag: { id: Number(id), name } })
    }
    const tagged = path.match(/^\/tags\/(\d+)\/subscribers$/)
    if (method === 'POST' && tagged) {
      const name = tags.get(tagged[1])
      const sub = subscribers.get(email)
      if (!name) return json(404, { errors: ['Not Found'] })
      if (!sub) return json(404, { errors: ['Subscriber not found'] })
      sub.tags.add(name)
      return json(201, { subscriber: { email_address: email } })
    }
    const formed = path.match(/^\/forms\/(\d+)\/subscribers$/)
    if (method === 'POST' && formed) {
      if (!forms.some((f) => f.id === formed[1])) return json(404, { errors: ['Not Found'] })
      const sub = subscribers.get(email)
      if (!sub) return json(404, { errors: ['Subscriber not found'] })
      sub.forms.add(formed[1])
      if (typeof body.referrer === 'string') sub.referrer = body.referrer
      return json(201, { subscriber: { email_address: email } })
    }
    if (method === 'GET' && path === '/forms') {
      return json(200, { forms: forms.map((f) => ({ id: Number(f.id), name: f.name, type: 'embed', archived: false })) })
    }
    if (method === 'GET' && path === '/subscribers') {
      const active = [...subscribers.values()].filter((s) => s.state === 'active').length
      return json(200, { subscribers: [], pagination: { total_count: active } })
    }
    if (method === 'GET' && path === '/account') {
      return json(200, { account: { name: 'n8builds', plan_type: 'newsletter', primary_email_address: 'updates@n8builds.dev' } })
    }
    return json(404, { errors: ['Not Found'] })
  }

  return {
    fetch: handle as typeof globalThis.fetch,
    calls,
    subscriber(email) {
      const s = subscribers.get(email)
      return s ? { email, state: s.state, tags: [...s.tags].sort(), forms: [...s.forms], referrer: s.referrer } : null
    },
    tags: () => [...tags].map(([id, name]) => ({ id, name })),
    confirm(email) {
      const s = subscribers.get(email)
      if (s) s.state = 'active'
    },
  }
}

const KEY = Symbol.for('n8builds.testKit')

/** The test-mode stand-in, one per process (the test server). */
export function testKit(): FakeKit {
  const global = globalThis as typeof globalThis & { [KEY]?: FakeKit }
  return (global[KEY] ??= fakeKit())
}
