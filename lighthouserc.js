// Lighthouse CI. Starts the production build (run `npm run build` first) on
// LHCI_PORT and audits the homepage and representative inner pages.
const port = Number(process.env.LHCI_PORT) || 3747
const base = `http://localhost:${port}`

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx next start -p ${port}`,
      startServerReadyPattern: 'Ready in',
      url: [`${base}/`, `${base}/blog`, `${base}/builds/asset-arsenal`, `${base}/loadout`],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
