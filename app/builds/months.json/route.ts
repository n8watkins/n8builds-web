import { getLogMonths } from '@/components/sections/BuildLogStrip'

/**
 * The build log's months as public JSON: the same figures and day bars as the
 * homepage card (BuildLogStrip's getLogMonths), without the rows. Read by the
 * owner's portfolio (n8watkins/dev-portfolio), which shows the month summary
 * in its bento grid (2026-11-09).
 *
 * Built from the same hourly-cached GitHub log as /builds, and served as a
 * static file regenerated about once an hour. Anyone may read it (CORS `*`):
 * it carries only what /builds already shows.
 *
 * Shape (version 1):
 *   { version, url, generatedAt, months: [{ id, title, changes, days: [{ day, count, future? }] }] }
 * `months[0]` is the newest (this month, or a quiet month's last 30 days, id
 * `recent`), then each month before it with something shipped, newest first.
 * When the log can't be read on a revalidation, the request fails, so the last
 * good answer keeps being served (as /builds does); only a build with no log
 * at all (no GitHub token) writes an empty `months`.
 */

export const dynamic = 'force-static'
export const revalidate = 3600

const SITE = 'https://n8builds.dev'

export async function GET() {
  const found = await getLogMonths()
  if (!found && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('Build log months: the log could not be read')
  }
  const months = found ?? []
  const body = {
    version: 1,
    url: `${SITE}/builds`,
    generatedAt: new Date().toISOString(),
    months: months.map((m) => ({
      id: m.id,
      // "November 2026", or "Last 30 days" in a quiet month.
      title: m.period,
      changes: Number(m.stats.find((s) => s.id === 'changes')?.value ?? 0),
      days: m.days,
    })),
  }
  return Response.json(body, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
