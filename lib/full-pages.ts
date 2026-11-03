/**
 * Pages of a list where every page is full (the homepage build log's rows,
 * components/sections/BuildLogPages.tsx; round 3 of 2026-11-02, "never
 * fewer"): when the items run out partway through the last page, it fills up
 * from the start again. With a page or less of items there is one page, with
 * just those items.
 *
 * Returns, page by page, the indexes of the items on it.
 */
export function fullPages(count: number, perPage: number): number[][] {
  if (count <= 0) return []
  if (count <= perPage) return [Array.from({ length: count }, (_, i) => i)]
  const pages = Math.ceil(count / perPage)
  return Array.from({ length: pages }, (_, p) => Array.from({ length: perPage }, (_, s) => (p * perPage + s) % count))
}
