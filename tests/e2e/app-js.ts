/**
 * The app's JavaScript chunks, for specs that hold them back to see the page
 * before it hydrates. JavaScript only: Turbopack serves CSS from the same
 * folder, and holding a stylesheet blocks the first paint, so the server HTML
 * would never show.
 */
export const APP_JS = '**/_next/static/chunks/**/*.js'
