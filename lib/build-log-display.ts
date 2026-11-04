// Display settings for the build log that its client components need. Kept
// apart from lib/build-log.ts, which fetches from GitHub and Sanity on the
// server, so importing them never pulls the fetchers into the browser graph.

/** The most notes a release shows; the rest wait on GitHub ("and N more"). */
export const RELEASE_NOTES_SHOWN = 5
