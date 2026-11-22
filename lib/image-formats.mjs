/**
 * The formats /_next/image may answer in, best first: next.config.mjs
 * (images.formats) and worker/edge-cache.js (the edge cache's key) share it.
 * The optimizer answers in the first one the browser's Accept lists.
 */
export const IMAGE_FORMATS = /** @type {const} */ (['image/avif', 'image/webp'])
