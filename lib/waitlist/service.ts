import type { UpcomingSlug } from '@/data/upcoming'
import { entryId, newToken, type WaitlistEntry, type WaitlistStore } from '@/lib/waitlist/store'
import { cleanInterest, cleanReferrer, normalizeEmail } from '@/lib/waitlist/schema'

/**
 * The waitlist's rules, apart from HTTP and email:
 * - Joining never changes what an address is signed up for on its own: the
 *   projects and note it asks for wait in `requested` until someone clicks
 *   the confirm link sent to that address (double opt-in). So a stranger
 *   typing your address can't add you to anything.
 * - The visitor sees the same answer whether the address is new, pending or
 *   already confirmed, so the form can't be used to find out who is on it.
 * - Leaving deletes the entry outright.
 */

const union = (a: UpcomingSlug[], b: UpcomingSlug[]) => [...new Set([...a, ...b])]

export type JoinRequest = {
  email: string
  projects: UpcomingSlug[]
  note: string
  interest?: string
  referrer?: string
}

export async function joinWaitlist(store: WaitlistStore, request: JoinRequest, now = new Date()): Promise<WaitlistEntry> {
  const email = normalizeEmail(request.email)
  const id = entryId(email)
  const at = now.toISOString()
  const existing = await store.get(id)

  const entry: WaitlistEntry = existing
    ? {
        ...existing,
        requested: union(existing.requested, request.projects),
        requestedNote: request.note || existing.requestedNote,
        updatedAt: at,
      }
    : {
        id,
        email,
        projects: [],
        requested: request.projects,
        note: '',
        requestedNote: request.note,
        createdAt: at,
        updatedAt: at,
        confirmedAt: '',
        interest: cleanInterest(request.interest),
        referrer: cleanReferrer(request.referrer),
        token: newToken(),
      }

  await store.save(entry)
  return entry
}

/** Applies what the address asked for. Null when the link is unknown or has expired. */
export async function confirmWaitlist(store: WaitlistStore, token: string, now = new Date()): Promise<WaitlistEntry | null> {
  const entry = await entryForToken(store, token)
  if (!entry) return null
  const at = now.toISOString()
  const confirmed: WaitlistEntry = {
    ...entry,
    projects: union(entry.projects, entry.requested),
    requested: [],
    note: entry.requestedNote || entry.note,
    requestedNote: '',
    confirmedAt: entry.confirmedAt || at,
    updatedAt: at,
  }
  await store.save(confirmed)
  return confirmed
}

/** Deletes the entry behind a leave link. False when there was nothing to delete. */
export async function leaveWaitlist(store: WaitlistStore, token: string): Promise<boolean> {
  const entry = await entryForToken(store, token)
  if (!entry) return false
  await store.remove(entry)
  return true
}

export async function findByEmail(store: WaitlistStore, email: string): Promise<WaitlistEntry | null> {
  return store.get(entryId(normalizeEmail(email)))
}

async function entryForToken(store: WaitlistStore, token: string): Promise<WaitlistEntry | null> {
  const id = await store.idForToken(token)
  if (!id) return null
  const entry = await store.get(id)
  // The link must still belong to that entry (a stale token key is ignored).
  return entry && entry.token === token ? entry : null
}
