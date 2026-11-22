// The pictures and clips in media/, at content-hashed URLs.
//
// A file in public/ keeps its URL when it changes, so Workers static assets
// serve it with `max-age=0, must-revalidate` and every visit asks for it again,
// and the image optimizer (/_next/image) can only cache what it knows will
// never change (a /_next/static/media/ source). The files in media/ are
// imported instead (next.config.mjs, turbopack.rules): each is emitted to
// /_next/static/media/<name>.<hash>.<ext>, so a re-recorded clip or a new
// picture under the same file name gets a new URL by construction, and every
// URL can be kept for a year (public/_headers, worker/range.js, OpenNext's
// image handler).
//
// Data files name a file by its path under media/ ('/games/n8games/hot-potato/clip.webm');
// the server components turn those into URLs here before rendering.

const FILES = import.meta.glob<string>(['/media/**/*.webp', '/media/**/*.mp4', '/media/**/*.webm'], {
  eager: true,
  import: 'default',
  query: '?url',
})

/** Every file in media/, by its path under media/ ('/games/dino.webp'). */
export function mediaPaths(): string[] {
  return Object.keys(FILES).map((key) => key.slice('/media'.length))
}

/**
 * The URL of a file in media/, by its path under it. Throws for a file that is
 * not there, so a wrong path fails the build (every page using these is static).
 */
export function media(path: string): string {
  const url = FILES[`/media${path}`]
  if (!url) throw new Error(`media${path}: no such file in media/`)
  return url
}

/** A looping clip with its URLs filled in (components/builds/n8games/LoopVideo.tsx). */
export function mediaClip<C extends { webm: string; mp4: string; poster: string; phone?: { webm: string; mp4: string } }>(clip: C): C {
  return {
    ...clip,
    webm: media(clip.webm),
    mp4: media(clip.mp4),
    poster: media(clip.poster),
    ...(clip.phone && { phone: { webm: media(clip.phone.webm), mp4: media(clip.phone.mp4) } }),
  }
}
