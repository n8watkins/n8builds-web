import type { UpcomingSlug } from '@/data/upcoming'
import { entryId, type WaitlistEntry, type WaitlistStore } from '@/lib/waitlist/store'
import { cleanInterest, cleanReferrer, normalizeEmail } from '@/lib/waitlist/schema'

/**
 * The waitlist's rules, apart from HTTP and email (the SQL is in store.ts):
 * - Joining never changes what an address is signed up for on its own: the
 *   projects and note it asks for wait as `requested` until someone clicks
 *   the confirm link sent to that address (double opt-in). So a stranger
 *   typing your address can't add you to anything.
 * - The visitor sees the same answer whether the address is new, pending or
 *   already confirmed, so the form can't be used to find out who is on it.
 * - A confirm link works once; leaving deletes the entry outright.
 */

export type JoinInput = {
  email: string
  projects: UpcomingSlug[]
  note: string
  interest?: string
  referrer?: string
}

export function joinWaitlist(store: WaitlistStore, request: JoinInput): Promise<WaitlistEntry> {
  return store.join({
    email: normalizeEmail(request.email),
    projects: request.projects,
    note: request.note,
    interest: cleanInterest(request.interest),
    referrer: cleanReferrer(request.referrer),
  })
}

/** Applies what the address asked for. Null when the link is unknown, used or expired. */
export function confirmWaitlist(store: WaitlistStore, token: string): Promise<WaitlistEntry | null> {
  return store.confirm(token)
}

/** Deletes the entry behind a leave link. False when there was nothing to delete. */
export function leaveWaitlist(store: WaitlistStore, token: string): Promise<boolean> {
  return store.leave(token)
}

export function findByEmail(store: WaitlistStore, email: string): Promise<WaitlistEntry | null> {
  return store.get(entryId(normalizeEmail(email)))
}
