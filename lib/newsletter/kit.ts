/**
 * Kit (kit.com, formerly ConvertKit) keeps the n8builds list and sends to it
 * (docs/DECISIONS.md "The newsletter runs on Kit"). This is its V4 API, only
 * the calls the site needs:
 *
 *   subscribe       a sign-up: the address is created as an "inactive"
 *                   subscriber, tagged (its topics, or its waitlist projects)
 *                   and added to the double opt-in form, so Kit sends its own
 *                   confirm email and only a confirmed address ever gets a
 *                   broadcast. Kit handles unsubscribes, bounces and
 *                   complaints itself.
 *   onlyForm        the sign-up form when the account has exactly one (so
 *                   KIT_FORM_ID is needed only once there are several).
 *   confirmedCount  how many confirmed (active) subscribers there are.
 *   diagnostics     read-only setup check for the admin: account, forms, tags.
 *
 * Nothing here creates or sends a broadcast: the owner writes those in Kit.
 *
 * Only the API key authenticates (header X-Kit-Api-Key): a Worker secret,
 * KIT_API_KEY, never in code or logs. Errors never carry an address. Every
 * call times out after 10 seconds.
 */

export const KIT_API = 'https://api.kit.com/v4'
const TIMEOUT_MS = 10_000
/** How long tag ids are remembered in this isolate (a renamed or deleted tag is found again after this). */
const TAG_CACHE_MS = 10 * 60 * 1000

export class KitError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'KitError'
  }
}

type Fetch = typeof globalThis.fetch

export type KitDiagnostics = {
  account: { ok: true; name: string | null; plan: string | null; sendingAddress: string | null } | { ok: false; error: string }
  forms: { ok: true; forms: { id: string; name: string; type: string | null; archived: boolean }[] } | { ok: false; error: string }
  tags: { ok: true; tags: { id: string; name: string }[] } | { ok: false; error: string }
}

export type KitClient = {
  subscribe(email: string, options: { formId: string; tags: string[]; referrer?: string | null }): Promise<{ ok: true }>
  onlyForm(): Promise<string | null>
  confirmedCount(): Promise<number>
  diagnostics(): Promise<KitDiagnostics>
}

/** Strips anything address-like from a message before it can reach a log. */
const scrub = (text: string) => text.replace(/[^\s@]+@[^\s@]+/g, '[email]')

/** A Kit V4 client, or null without an API key. */
export function kitClient({
  apiKey,
  base,
  // Looked up on each call, not once, so a long-lived client sees a replaced fetch (tests).
  fetch: f = (input, init) => globalThis.fetch(input, init),
}: {
  apiKey?: string | null
  base?: string | null
  fetch?: Fetch
}): KitClient | null {
  const key = String(apiKey ?? '').trim()
  if (!key) return null
  const root = String(base || KIT_API).replace(/\/$/, '')
  let tagCache: { at: number; ids: Map<string, string> } | null = null

  async function call<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const where = `${method} ${path.split('?')[0].replace(/\d+/g, ':id')}`
    let res: Response
    try {
      res = await f(`${root}${path}`, {
        method,
        headers: { 'X-Kit-Api-Key': key, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      throw new KitError(`kit ${where} unreachable: ${scrub(error instanceof Error ? error.name : 'error')}`, 0)
    }
    const text = await res.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // Not JSON: only the status matters then.
    }
    if (!res.ok) {
      // Kit's errors are { errors: [string] }; nothing else is echoed (no addresses in logs).
      const errors = (data as { errors?: unknown } | null)?.errors
      const why = Array.isArray(errors) ? errors.map(String).join('; ') : ''
      throw new KitError(scrub(`kit ${where} ${res.status}${why ? `: ${why}` : ''}`).slice(0, 300), res.status)
    }
    return data as T
  }

  type Tag = { id: number | string; name: string }

  /** Every tag on the account, following Kit's cursor pages. */
  async function allTags(): Promise<Tag[]> {
    const tags: Tag[] = []
    let after: string | null = null
    for (let page = 0; page < 20; page++) {
      const data: { tags?: Tag[]; pagination?: { has_next_page?: boolean; end_cursor?: string | null } } = await call(
        'GET',
        `/tags?per_page=1000${after ? `&after=${encodeURIComponent(after)}` : ''}`
      )
      tags.push(...(data?.tags ?? []))
      if (!data?.pagination?.has_next_page || !data.pagination.end_cursor) break
      after = data.pagination.end_cursor
    }
    return tags
  }

  /** The ids of these tags, by exact name, creating any the account doesn't have yet. */
  async function tagIds(names: string[]): Promise<string[]> {
    if (!tagCache || Date.now() - tagCache.at > TAG_CACHE_MS || names.some((n) => !tagCache!.ids.has(n))) {
      tagCache = { at: Date.now(), ids: new Map((await allTags()).map((t) => [t.name, String(t.id)])) }
    }
    const ids: string[] = []
    for (const name of names) {
      let id = tagCache.ids.get(name)
      if (!id) {
        // Kit answers an existing name with that tag (200), a new one with 201.
        const data: { tag?: Tag } = await call('POST', '/tags', { name })
        if (data?.tag?.id == null) throw new KitError('kit tag id missing', 0)
        id = String(data.tag.id)
        tagCache.ids.set(name, id)
      }
      ids.push(id)
    }
    return ids
  }

  return {
    async subscribe(email, { formId, tags, referrer = null }) {
      if (!/^\d+$/.test(String(formId ?? ''))) throw new KitError('kit form id missing', 0)
      // An address Kit already has keeps its state (a confirmed one stays confirmed).
      await call('POST', '/subscribers', { email_address: email, state: 'inactive' })
      // Tags first, so they are in place by the time the address is confirmed.
      const names = [...new Set(tags)]
      const ids = await tagIds(names)
      for (const [i, name] of names.entries()) {
        const id = ids[i]
        try {
          await call('POST', `/tags/${id}/subscribers`, { email_address: email })
        } catch (error) {
          // A remembered tag deleted in Kit since: look it up (or create it) again, once.
          if (!(error instanceof KitError) || error.status !== 404) throw error
          tagCache = null
          const [fresh] = await tagIds([name])
          await call('POST', `/tags/${fresh}/subscribers`, { email_address: email })
        }
      }
      // The double opt-in form: Kit sends the confirm email when the address is new to it.
      await call('POST', `/forms/${formId}/subscribers`, { email_address: email, ...(referrer ? { referrer } : {}) })
      return { ok: true }
    },

    async onlyForm() {
      const data: { forms?: { id?: number | string }[] } = await call('GET', '/forms?status=active&per_page=2')
      const forms = Array.isArray(data?.forms) ? data.forms : []
      return forms.length === 1 && forms[0]?.id != null ? String(forms[0].id) : null
    },

    async confirmedCount() {
      const data: { pagination?: { total_count?: number } } = await call('GET', '/subscribers?status=active&include_total_count=true&per_page=1')
      const n = Number(data?.pagination?.total_count)
      if (!Number.isFinite(n)) throw new KitError('kit subscriber count missing', 0)
      return n
    },

    async diagnostics() {
      const part = async <T extends object>(path: string, pick: (d: never) => T): Promise<({ ok: true } & T) | { ok: false; error: string }> => {
        try {
          return { ok: true, ...pick((await call('GET', path)) as never) }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'error' }
        }
      }
      type Account = { account?: { name?: string; plan_type?: string; primary_email_address?: string } }
      type Forms = { forms?: { id: number | string; name: string; type?: string; archived?: boolean }[] }
      return {
        account: await part('/account', (d: Account) => ({
          name: d?.account?.name ?? null,
          plan: d?.account?.plan_type ?? null,
          sendingAddress: d?.account?.primary_email_address ?? null,
        })),
        forms: await part('/forms?status=all&per_page=50', (d: Forms) => ({
          forms: (d?.forms ?? []).map((form) => ({ id: String(form.id), name: form.name, type: form.type ?? null, archived: Boolean(form.archived) })),
        })),
        tags: await part('/tags?per_page=1000', (d: { tags?: Tag[] }) => ({
          tags: (d?.tags ?? []).map((t) => ({ id: String(t.id), name: t.name })),
        })),
      }
    },
  }
}
