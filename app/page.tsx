import HomePage from '@/components/HomePage'
import JsonLd from '@/components/JsonLd'
import { pageMetadata, siteJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'n8builds | Public Builder Lab',
  description: 'Spending tokens, shipping features. Apps, AI tools, Chrome extensions, local utilities, and the build logs behind them.',
  shareDescription: 'Spending tokens, shipping features. Apps, tools, experiments, and build logs.',
  path: '/',
})

export default function Home() {
  return (
    <>
      <JsonLd data={siteJsonLd} />
      <HomePage />
    </>
  )
}
