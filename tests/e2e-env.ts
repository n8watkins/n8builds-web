// Shared by playwright.config.ts and the specs. A dedicated port keeps the
// test server from colliding with (or being mistaken for) `npm run dev` on 3737.
// E2E_PORT overrides it so several checkouts can run the suite at once.
export const E2E_PORT = Number(process.env.E2E_PORT) || 3747
// E2E_REMOTE_URL runs the suite against a deployed site instead (no local
// server). That site is in production mode, not test mode, so the specs that
// need test mode (contact sends, live scenarios, the waitlist) fail there by
// design; DEPLOY.md lists the ones to run.
export const E2E_REMOTE_URL = process.env.E2E_REMOTE_URL?.replace(/\/$/, '')
export const E2E_BASE_URL = E2E_REMOTE_URL || `http://localhost:${E2E_PORT}`

// A successful contact-form send chains a real Cloudflare script load, a
// Turnstile token, the API call, and the success transition. That takes longer
// than Playwright's default 5s on a loaded CI runner.
export const SEND_TIMEOUT = 15_000
