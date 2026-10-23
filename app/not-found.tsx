import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Not found | n8builds',
  description: 'Nothing in the lab at this address.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-darkBlue flex items-center justify-center">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="text-center px-5 focus:outline-none">
        <h1 className="text-6xl font-bold mb-4">
          <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">404</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Nothing in the lab at this address
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all duration-200 hover:scale-[1.02]"
        >
          Back to n8builds
        </Link>
      </main>
    </div>
  )
}
