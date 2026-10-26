"use client";

import { captureError } from '@/lib/sentry/lazy'
import NextError from "next/error";
import { useEffect } from "react";

// App Router top-level error boundary - catches errors in the root layout that
// the per-section boundaries can't. Reports to Sentry (no-op until DSN is set).
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureError(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
