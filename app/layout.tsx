import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ThemeProvider } from './provider'
import ErrorBoundary from '@/components/ErrorBoundary'
import { WebVitals } from './web-vitals'
import { WebVitalsHUD } from '@/components/WebVitalsHUD'
import LiveLoader from '@/components/live/LiveLoader'
import SiteFooter from '@/components/layout/SiteFooter'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { DEFAULT_PREVIEW, SITE_NAME, SITE_URL } from '@/lib/seo'
import { consentBootstrapScript } from '@/lib/consent'
import { MY_TOOLS_MOVED } from '@/lib/movedAnchors'
import ConsentLoader from '@/components/consent/ConsentLoader'

// Inter, bundled (variable weight, Latin subset, from @fontsource-variable/inter
// 5.3.0; OFL, see app/fonts/Inter-OFL.txt) instead of next/font/google: a
// build fetching from Google Fonts failed whenever Google didn't answer.
const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const description = 'Think bigger. Ship sooner. Apps, AI tools, Chrome extensions, local utilities, and the build logs behind them.'

// Site-wide defaults. Each page replaces title, description, canonical, and the
// share cards through pageMetadata() (lib/seo.ts); these cover anything else,
// such as the 404 page, without claiming the homepage's URL.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Public Builder Lab`,
  description,
  keywords: ['Nathan Watkins', 'n8builds', 'Public Builder', 'Next.js', 'AI Tools', 'Chrome Extensions'],
  openGraph: {
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [DEFAULT_PREVIEW],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_PREVIEW],
    creator: '@n8watkins',
  },
  icons: {
    icon: [
      { url: '/tab/n8-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/tab/n8-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/tab/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      // The site scrolls smoothly (globals.css), and without this a route change
      // smooth-scrolls the new page up from wherever the old one was: a post
      // opened from the homepage glided a second's worth to its top. With it,
      // Next.js turns smoothing off during navigation, so a new page starts at
      // its top, while in-page anchors keep scrolling smoothly.
      data-scroll-behavior="smooth"
      suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="UaCoLg9YeNobXjRaOb59YzQxzc8RDb1yiOZEKdmNECU" />

        {/* Project external links */}
        <link rel="dns-prefetch" href="//github.com" />
        <link rel="dns-prefetch" href="//vercel.app" />

        {/* The Lab's "My tools" part (/#my-tools) moved to /loadout's "Tools I built
            and use" (2026-11-01). A hash never reaches the server, so this sends
            such links on as the page starts to parse, before anything paints.
            In the root layout's head, not the homepage (round 5 of 2026-11-02):
            React warns about a script it renders on a client navigation, and a
            layout never re-renders then (HomeEffects covers those arrivals). */}
        <script id="my-tools-moved" dangerouslySetInnerHTML={{ __html: MY_TOOLS_MOVED }} />

        {/* Google Analytics with Consent Mode v2 (lib/consent.ts): the
            defaults are set before gtag.js can load, European visitors are
            asked first, and gtag.js loads after the page is loaded and idle. */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <script
            id="consent-bootstrap"
            dangerouslySetInnerHTML={{ __html: consentBootstrapScript(process.env.NEXT_PUBLIC_GA_ID) }}
          />
        )}
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-9999 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <SiteFooter />
          {/* Checks /api/live after load; the corner player loads only while live. */}
          <LiveLoader />
          {/* Asks European visitors about analytics; the banner itself loads only when needed. */}
          {process.env.NEXT_PUBLIC_GA_ID && <ConsentLoader />}
          <WebVitals />
          <WebVitalsHUD />
          {/* These scripts are served only by Vercel's edge; elsewhere they 404. */}
          {process.env.VERCEL && <SpeedInsights />}
          {process.env.VERCEL && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
