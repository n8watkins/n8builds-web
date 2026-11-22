// The URL a file in media/ is served at (lib/media.ts): /_next/static/media/,
// its name, then its content's hash. Built from the file's path under media/,
// so a spec can check a page uses that file without knowing the hash.

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Matches the served URL of `path` (a path under media/), at the end of a string. */
export function hashedMedia(path: string): RegExp {
  const file = path.slice(path.lastIndexOf('/') + 1)
  const dot = file.lastIndexOf('.')
  return new RegExp(`/_next/static/media/${escape(file.slice(0, dot))}\\.[\\w-]+${escape(file.slice(dot))}$`)
}

/** The same, for an attribute selector's prefix and suffix: `[poster^="..."][poster$="..."]`. */
export function hashedMediaSelector(attribute: string, path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  const dot = file.lastIndexOf('.')
  return `[${attribute}^="/_next/static/media/${file.slice(0, dot)}."][${attribute}$="${file.slice(dot)}"]`
}
