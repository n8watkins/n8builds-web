import HomePage from '@/components/HomePage'
import JsonLd from '@/components/JsonLd'
import { pageMetadata, siteJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'n8builds — Public Builder Lab',
  description: 'Apps, AI tools, Chrome extensions, local utilities, and build logs — all in public.',
  shareDescription: 'Building software in public. Apps, tools, experiments, and build logs.',
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
