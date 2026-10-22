// Shared by playwright.config.ts and the specs. A dedicated port keeps the
// test server from colliding with (or being mistaken for) `npm run dev` on 3737.
// E2E_PORT overrides it so several checkouts can run the suite at once.
export const E2E_PORT = Number(process.env.E2E_PORT) || 3747
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`
