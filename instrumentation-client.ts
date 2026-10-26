// Sentry in the browser. Inert until NEXT_PUBLIC_SENTRY_DSN is set (no DSN =
// no SDK download, no network calls). The SDK itself loads lazily, once the
// page is idle (lib/sentry/lazy.ts); until then these listeners catch any
// error so it is reported once the SDK is up.
import { captureError, captureRouterTransitionStart, loadSentry } from '@/lib/sentry/lazy'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn && typeof window !== 'undefined') {
  const onError = (event: ErrorEvent) => captureError(event.error ?? event.message)
  const onRejection = (event: PromiseRejectionEvent) => captureError(event.reason)
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)

  const start = () =>
    loadSentry().then(() => {
      // From here Sentry's own global handlers report errors.
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    })
  const whenIdle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 8_000 }) : setTimeout(start, 3_000)
  if (document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { once: true })
}

// App Router navigations, for tracing once the SDK has loaded.
export const onRouterTransitionStart = captureRouterTransitionStart
