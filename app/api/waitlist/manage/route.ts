import { NextRequest, NextResponse } from 'next/server'
import { UPCOMING } from '@/data/upcoming'
import { logger } from '@/lib/logger'
import { manageSchema } from '@/lib/waitlist/schema'
import { waitlistStore, type WaitlistEntry } from '@/lib/waitlist/store'
import { closed, fail, readJson, unavailable } from '@/lib/waitlist/http'

/** What the manage page shows: each project the address is on, confirmed or waiting on its confirm link. */
function view(entry: WaitlistEntry) {
  const on = new Set([...entry.projects, ...entry.requested])
  return {
    projects: UPCOMING.filter((p) => on.has(p.slug)).map((p) => ({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      icon: p.icon,
      confirmed: entry.projects.includes(p.slug),
    })),
  }
}

/**
 * POST /api/waitlist/manage - the manage page behind an email's leave link
 * (/upcoming/leave?t=). No login: the leave token identifies the address,
 * does nothing else, and expires as it always has.
 * - `{ token }`: the projects the address is on.
 * - `{ token, keep }`: stays on only those; keeping none leaves the waitlist.
 * No per-IP limit: the token's 24 random bytes are the proof (as for a mail
 * client's one-click unsubscribe), and one visit is a load plus a save or two.
 */
export async function POST(request: NextRequest) {
  const body = await readJson(request)
  if ('response' in body) return body.response
  const parsed = manageSchema.safeParse(body.data)
  if (!parsed.success) return fail(400, 'This link looks incomplete. Please open it from the email again.')

  const store = await waitlistStore()
  if (!store) return closed()

  const gone = () => fail(404, 'This address is no longer on the waitlist, or the link has expired.', 'gone')
  try {
    const { token, keep } = parsed.data
    if (!keep) {
      const entry = await store.forLeaveToken(token)
      return entry ? NextResponse.json(view(entry)) : gone()
    }
    if (!(await store.forLeaveToken(token))) return gone()
    const entry = await store.keepOnly(token, keep)
    return NextResponse.json(entry ? { ...view(entry), message: 'Saved' } : { projects: [], message: 'Removed' })
  } catch (error) {
    logger.error('Waitlist manage failed:', error instanceof Error ? error.message : error)
    return unavailable()
  }
}
