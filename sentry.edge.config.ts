// Sentry — edge runtime init (middleware, edge routes). Inert until a DSN is set.
import * as Sentry from '@sentry/nextjs'
import { dataCollection } from '@/lib/sentry-data-collection'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  dataCollection: dataCollection(),
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
})
