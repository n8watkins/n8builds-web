import { defineConfig, devices } from '@playwright/test'
import { E2E_BASE_URL, E2E_PORT } from './tests/e2e-env'

/**
 * Playwright runs against a production build (`next build && next start`) in
 * CONTACT_TEST_MODE, with Cloudflare's always-pass Turnstile test keys. Nothing
 * here reads .env.local: no email is sent, and analytics/Sentry are off.
 *
 * Projects:
 * - api:      contact API tests (no browser)
 * - chromium: page smoke, accessibility, and contact-form UI tests
 * - firefox / webkit / mobile: the same browser tests, run nightly in CI
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries hide flakiness; fix flaky tests instead.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'api', testMatch: /api\/.*\.spec\.ts/ },
    { name: 'chromium', testIgnore: /api\//, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: /api\//, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testIgnore: /api\//, use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', testIgnore: /api\//, use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', testIgnore: /api\//, use: { ...devices['iPhone 14'] } },
  ],

  webServer: {
    // E2E_SKIP_BUILD=1 reuses an existing test build instead of rebuilding.
    command: process.env.E2E_SKIP_BUILD
      ? `npx next start -p ${E2E_PORT}`
      : `npm run build && npx next start -p ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      CONTACT_TEST_MODE: '1',
      // High enough that the suite never trips the site-wide cap; the cap
      // itself is covered by unit tests.
      CONTACT_DAILY_LIMIT: '100000',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      NEXT_PUBLIC_SITE_URL: 'https://n8builds.dev',
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w',
      // The build log reads its recorded GitHub fixture, never live GitHub.
      BUILD_LOG_FIXTURE: '1',
      GITHUB_TOKEN: '',
      // Explicitly blank so values in .env.local can't leak into test builds.
      NEXT_PUBLIC_GA_ID: '',
      NEXT_PUBLIC_SENTRY_DSN: '',
      SENTRY_DSN: '',
      SENTRY_AUTH_TOKEN: '',
      KV_REST_API_URL: '',
      KV_REST_API_TOKEN: '',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
      // A .env.local from `vercel env pull` sets these, and test mode is
      // (deliberately) ignored on anything that looks like Vercel.
      VERCEL: '',
      VERCEL_ENV: '',
      VERCEL_URL: '',
    },
  },
})
