import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs/config'
import { securityHeaders } from './lib/security/headers.mjs'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Every source the optimizer accepts is one more image (and transformation)
    // anyone can make it fetch, so these are exact: no query strings, only our
    // own Sanity project, and only the one remote image we show.
    localPatterns: [{ pathname: '/**', search: '' }],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sprite-bench.vercel.app',
        pathname: '/opengraph-image',
        search: '',
      },
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
    return [
      {
        source: '/portfolio',
        destination: 'https://portfolio.n8builds.dev',
        permanent: false,
      },
      {
        source: '/appturnity',
        destination: 'https://appturnity.com',
        permanent: false,
      },
      {
        source: '/sprite-bench',
        destination: 'https://sprite-bench.vercel.app',
        permanent: false,
      },
      // The shelf pages were folded into the homepage Lab section — redirect the
      // old routes to their on-page anchors so existing links/bookmarks still land.
      { source: '/lab', destination: '/#lab', permanent: false },
      { source: '/extensions', destination: '/#extensions', permanent: false },
      { source: '/tools', destination: '/#tools', permanent: false },
      // The Resources section was dropped; send old links to the Lab.
      { source: '/resources', destination: '/#lab', permanent: false },
      // Builds dropped from the site on 2026-10-21; their old detail pages were in the sitemap.
      { source: '/builds/:slug(canihost|freestack|apiscout)', destination: '/#lab', permanent: false },
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
          preview: process.env.VERCEL_ENV === 'preview',
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        }),
      },
    ]
  },
}

// Wrap with Sentry. Source-map upload runs only when SENTRY_AUTH_TOKEN (+ ORG/
// PROJECT) are set — without them the build still succeeds, you just get
// minified stack traces. The runtime SDK stays inert until NEXT_PUBLIC_SENTRY_DSN
// is set, so this is safe to ship before the Sentry project exists.
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: 'nathan-watkins',
  project: 'n8builds',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  silent: !process.env.CI,
  // Drop SDK code this site never runs: debug logging, and Session Replay's
  // iframe and shadow-DOM recording (no iframes or shadow roots of ours to
  // replay). Replay itself, tracing, and error capture are unchanged.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },
})
