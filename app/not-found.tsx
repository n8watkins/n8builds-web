import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050812] flex items-center justify-center">
      <div className="text-center px-5">
        <h1 className="text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">404</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Nothing in the lab at this address
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all duration-200 hover:scale-[1.02]"
        >
          Back to Nate Builds
        </Link>
      </div>
    </div>
  )
}
