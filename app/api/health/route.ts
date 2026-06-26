// Liveness check — returns 200 so platform/uptime probes have something to hit.
// Intentionally minimal: no env, uptime, memory, or dependency details. This is a
// public, no-auth site, so there's nothing to gate and nothing worth exposing.
// (Client error reports POST to /api/health/error separately.)
export async function GET() {
  return Response.json({ status: 'ok' })
}
