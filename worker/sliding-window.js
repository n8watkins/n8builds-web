/**
 * One request against a sliding-window limit: at most `max` allowed requests
 * in any `windowMs` span. `hits` holds the times of the requests it allowed
 * (milliseconds, oldest first); a refused request isn't counted.
 * @param {number[]} hits
 * @param {number} now
 * @param {number} max
 * @param {number} windowMs
 * @returns {{ allowed: boolean, hits: number[] }}
 */
export function slide(hits, now, max, windowMs) {
  const recent = hits.filter((time) => time > now - windowMs)
  if (recent.length >= max) return { allowed: false, hits: recent }
  return { allowed: true, hits: [...recent, now] }
}
