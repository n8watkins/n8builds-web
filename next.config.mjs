import { withSentryConfig } from '@sentry/nextjs/config'
import { securityHeaders } from './lib/security/headers.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Every source the optimizer accepts is one more image (and transformation)
    // anyone can make it fetch, so these are exact: no query strings, and only
    // our own Sanity project.
    localPatterns: [{ pathname: '/**', search: '' }],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/abgyc32w/production/**',
        search: '',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['motion/react', 'react-icons'],
  },
  async redirects() {
    // /portfolio, /techforpros and /appturnity are counted short links: route handlers, not redirects here.
    return [
      // www.n8builds.dev is a second custom domain on the Worker (wrangler.jsonc);
      // it sends visitors to the apex, keeping the path and query.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.n8builds.dev' }],
        destination: 'https://n8builds.dev/:path*',
        permanent: true,
      },
      // The shelf pages were folded into the homepage Lab section — redirect the
      // old routes to their on-page anchors so existing links/bookmarks still land.
      // Permanent (308), so search engines move these URLs over instead of keeping them.
      { source: '/lab', destination: '/#lab', permanent: true },
      { source: '/extensions', destination: '/#extensions', permanent: true },
      // Tools are the ones the owner built and uses, Scribe first, on /loadout (OpenPing is a featured build).
      { source: '/tools', destination: '/loadout#tools-i-built', permanent: false },
      // The Resources section was dropped; send old links to the Lab.
      { source: '/resources', destination: '/#lab', permanent: true },
      // Builds dropped from the site (2026-10-21 and 2026-10-22); their old detail pages were in the sitemap.
      {
        source: '/builds/:slug(canihost|freestack|apiscout|suggestion-box|repo-steward|sprite-arsenal|asset-arsenal|jobsignal)',
        destination: '/#lab',
        permanent: true,
      },
      // Appturnity's home is its own site, not a build page here.
      { source: '/builds/appturnity', destination: 'https://appturnity.com', permanent: true },
      // Piper TTS was renamed VoiceDock (2026-11-02): old links land on its new page.
      { source: '/builds/piper-tts', destination: '/builds/voicedock', permanent: true },
      // The developer portfolio's page moved to the shorter /builds/portfolio (2026-11-10).
      { source: '/builds/dev-portfolio', destination: '/builds/portfolio', permanent: true },
      // On hold, not retired: temporary, so it can come back at the same URL.
      { source: '/builds/chrome-extension-kit', destination: '/#extensions', permanent: false },
      { source: '/builds/vibelog', destination: '/#lab', permanent: false },
      // Wren left this site (owner, 2026-11-11); it is a project on the portfolio, so its old page lands on its page there.
      { source: '/builds/wren', destination: 'https://portfolio.n8builds.dev/projects/wren', permanent: true },
      // The self-sent newsletter's confirm and unsubscribe pages: Kit has its own now (lib/newsletter/kit.ts).
      { source: '/newsletter/:path*', destination: '/blog', permanent: false },
      // RFC 9116: canonical lives at /.well-known/security.txt; redirect the
      // legacy root path some scanners still probe.
      { source: '/security.txt', destination: '/.well-known/security.txt', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          dev: process.env.NODE_ENV !== 'production',
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        }),
      },
    ]
  },
}

// Wrap with Sentry. Source-map upload runs only when SENTRY_AUTH_TOKEN (+ ORG/
// PROJECT) are set; without them the build still succeeds, you just get
// minified stack traces. The runtime SDK stays inert until NEXT_PUBLIC_SENTRY_DSN
// is set, so this is safe to ship before the Sentry project exists.
export default withSentryConfig(nextConfig, {
  org: 'nathan-watkins',
  project: 'n8builds',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  silent: !process.env.CI,
  // Drop SDK code this site never runs: debug logging, and Session Replay's
  // iframe and shadow-DOM recording (no iframes or shadow roots of ours to
  // replay). Replay itself, tracing, and error capture are unchanged. Since
  // v11 the SDK applies these to Turbopack builds too (as compiler.define).
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },
})
