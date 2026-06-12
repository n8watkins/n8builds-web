import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './provider'
import Script from 'next/script'
import ErrorBoundary from '@/components/ErrorBoundary'
import { WebVitals } from './web-vitals'
import { WebVitalsHUD } from '@/components/WebVitalsHUD'
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
  fallback: ['system-ui', 'arial']
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://n8builds.dev'
const siteName = 'Nate Builds'

export const metadata: Metadata = {
  title: `${siteName} — Public Builder Lab`,
  description: 'Apps, AI tools, Chrome extensions, local utilities, and build logs — all in public.',
  keywords: ['Nathan Watkins', 'Nate Builds', 'Public Builder', 'Next.js', 'AI Tools', 'Chrome Extensions'],
  robots: 'index, follow',
  openGraph: {
    title: `${siteName} — Public Builder Lab`,
    description: 'Apps, AI tools, Chrome extensions, local utilities, and build logs — all in public.',
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `${siteUrl}/tab/preview.png`,
        width: 1200,
        height: 630,
        alt: 'Nate Builds Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} — Public Builder Lab`,
    description: 'Building software in public. Apps, tools, experiments, and build logs.',
    images: [`${siteUrl}/tab/preview.png`],
    creator: '@n8watkins',
  },
  icons: {
    icon: [
      { url: '/tab/n8-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/tab/n8-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/tab/apple-icon.png',
  },
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="UaCoLg9YeNobXjRaOb59YzQxzc8RDb1yiOZEKdmNECU" />

        {/* Preconnect and DNS prefetching for external domains */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* Project external links */}
        <link rel="dns-prefetch" href="//github.com" />
        <link rel="dns-prefetch" href="//appturnity.com" />
        <link rel="dns-prefetch" href="//vercel.app" />

        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <WebVitals />
          <WebVitalsHUD />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
