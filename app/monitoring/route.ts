// The Sentry tunnel (lib/sentry/tunnel.ts). In production the Worker answers
// /monitoring before Next (worker/index.js); this route serves `next dev`,
// `next start` and the tests the same way.
import { forwardEnvelope } from '@/lib/sentry/tunnel'

export function POST(request: Request) {
  return forwardEnvelope(request, process.env.NEXT_PUBLIC_SENTRY_DSN)
}
