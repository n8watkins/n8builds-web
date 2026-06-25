// Health check.
//
// Detailed diagnostics (environment, uptime, memory, dependency flags, version)
// are returned ONLY when a valid bearer token is presented AND
// HEALTH_CHECK_SECRET is configured. Without the secret the endpoint is a
// minimal liveness ping that leaks nothing — so it's safe to leave public even
// if the secret is never set in the deploy environment.
//
// To enable full diagnostics: set HEALTH_CHECK_SECRET in Vercel, then call with
//   Authorization: Bearer <secret>

// Simple dependency health check
async function checkDependencies() {
  return {
    sentry: !!process.env.SENTRY_ORG,
    analytics: !!process.env.NEXT_PUBLIC_GA_ID,
    env: process.env.NODE_ENV || 'unknown',
  }
}

export async function GET(request: Request) {
  const expectedToken = process.env.HEALTH_CHECK_SECRET
  const authHeader = request.headers.get('authorization')
  const authorized = !!expectedToken && authHeader === `Bearer ${expectedToken}`

  // Public, unauthenticated path: minimal liveness only — no env / uptime /
  // memory / dependency details exposed.
  if (!authorized) {
    return Response.json({ status: 'ok' })
  }

  try {
    const dependencies = await checkDependencies()
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_VERSION || '2.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      dependencies
    }

    return Response.json(healthData)
  } catch (error) {
    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 })
  }
}
