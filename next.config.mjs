import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sprite-bench.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
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
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-icons',
    ],
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
      { source: '/resources', destination: '/#resources', permanent: false },
      // RFC 9116: canonical lives at /.well-known/security.txt; redirect the
      // legacy root path some scanners still probe.
      { source: '/security.txt', destination: '/.well-known/security.txt', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
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
  tunnelRoute: '/monitoring',
  silent: !process.env.CI,
})
