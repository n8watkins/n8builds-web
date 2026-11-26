/**
 * What the homepage build log's list says for a day picked on the card when
 * the day has no entries of its own to show (components/sections/BuildLogMonths.tsx).
 * The card counts changes (commits that read as news, and releases); the list
 * shows entries, one per build per day. A day can have changes and no entry
 * when its work was all in an unlisted project, which counts but is never
 * named. Null when there are entries to show.
 */
export function dayListNote(changes: number, entries: number): string | null {
  if (entries > 0) return null
  if (changes === 0) return 'Nothing shipped that day.'
  return `${changes} ${changes === 1 ? 'change' : 'changes'} that day; none have a write-up here.`
}
