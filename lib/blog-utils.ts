// Client-safe blog helpers (no @sanity/client import, so these can be used in
// client components without pulling the Sanity SDK into the browser bundle).

// Deterministic date formatting (fixed UTC) to avoid SSR/client hydration drift.
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
