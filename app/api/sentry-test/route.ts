// TEMPORARY — verifies Sentry captures server errors in prod. Delete after the
// event lands in Sentry (instrumentation.ts onRequestError reports the throw).
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  throw new Error('Sentry test error — n8builds prod verification (delete me)')
}
