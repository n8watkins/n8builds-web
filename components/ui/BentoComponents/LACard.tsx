import React from 'react'
import { FaLocationDot } from 'react-icons/fa6'

const LACard = () => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      {/* LA skyline + palm tree SVG background */}
      <svg
        viewBox="0 0 320 220"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 left-0 right-0 w-full h-auto opacity-70"
        aria-hidden="true"
      >
        <defs>
          <filter id="glow-la">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="skyline-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#36e8ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Palm tree trunk */}
        <path
          d="M 52,220 C 50,195 48,175 54,155 C 58,140 65,125 68,108"
          fill="none"
          stroke="url(#skyline-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glow-la)"
        />
        {/* Palm fronds */}
        <path d="M 68,108 C 80,96 100,88 118,82" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" strokeLinecap="round" filter="url(#glow-la)" />
        <path d="M 68,108 C 78,90 90,75 102,62" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" strokeLinecap="round" filter="url(#glow-la)" />
        <path d="M 68,108 C 66,88 62,68 60,50" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" strokeLinecap="round" filter="url(#glow-la)" />
        <path d="M 68,108 C 58,92 46,78 30,68" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" strokeLinecap="round" filter="url(#glow-la)" />
        <path d="M 68,108 C 56,100 40,96 20,95" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" strokeLinecap="round" filter="url(#glow-la)" />
        {/* Drooping fronds */}
        <path d="M 68,108 C 82,112 98,118 112,128" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow-la)" opacity="0.6" />
        <path d="M 68,108 C 55,115 42,122 28,130" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow-la)" opacity="0.6" />

        {/* LA Skyline — right half */}
        {/* Ground line */}
        <line x1="140" y1="220" x2="320" y2="220" stroke="url(#skyline-grad)" strokeWidth="1.5" opacity="0.4" />

        {/* Buildings — simplified LA silhouette */}
        {/* Far left building */}
        <rect x="145" y="175" width="16" height="45" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />
        {/* Antenna on top */}
        <line x1="153" y1="175" x2="153" y2="162" stroke="url(#skyline-grad)" strokeWidth="1" filter="url(#glow-la)" />

        <rect x="165" y="160" width="12" height="60" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />

        {/* Wilshire Grand / U.S. Bank area — tallest cluster */}
        <rect x="182" y="130" width="14" height="90" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" filter="url(#glow-la)" />
        {/* Spire */}
        <path d="M 186,130 L 189,112 L 192,130" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />

        <rect x="200" y="145" width="18" height="75" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.8" filter="url(#glow-la)" />
        {/* Rooftop detail */}
        <line x1="200" y1="145" x2="218" y2="145" stroke="url(#skyline-grad)" strokeWidth="1" opacity="0.5" />

        {/* US Bank Tower */}
        <rect x="222" y="115" width="16" height="105" fill="none" stroke="url(#skyline-grad)" strokeWidth="2" filter="url(#glow-la)" />
        <path d="M 224,115 L 230,100 L 236,115" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />

        <rect x="242" y="148" width="14" height="72" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />

        <rect x="260" y="162" width="20" height="58" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />
        <rect x="264" y="155" width="12" height="7" fill="none" stroke="url(#skyline-grad)" strokeWidth="1" filter="url(#glow-la)" />

        <rect x="284" y="172" width="14" height="48" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />
        <rect x="300" y="180" width="18" height="40" fill="none" stroke="url(#skyline-grad)" strokeWidth="1.5" filter="url(#glow-la)" />

        {/* Windows on taller buildings — small dots of light */}
        <circle cx="190" cy="148" r="1.2" fill="#36e8ff" opacity="0.7" />
        <circle cx="190" cy="158" r="1.2" fill="#36e8ff" opacity="0.5" />
        <circle cx="190" cy="168" r="1.2" fill="#8b5cf6" opacity="0.7" />
        <circle cx="207" cy="155" r="1.2" fill="#36e8ff" opacity="0.6" />
        <circle cx="207" cy="165" r="1.2" fill="#8b5cf6" opacity="0.5" />
        <circle cx="230" cy="128" r="1.2" fill="#36e8ff" opacity="0.8" />
        <circle cx="230" cy="138" r="1.2" fill="#8b5cf6" opacity="0.6" />
        <circle cx="230" cy="148" r="1.2" fill="#36e8ff" opacity="0.5" />
        <circle cx="230" cy="158" r="1.2" fill="#36e8ff" opacity="0.7" />
      </svg>

      {/* Gradient fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020621] via-[#020621]/60 to-transparent rounded-3xl pointer-events-none" />

      {/* Text content */}
      <div className="absolute bottom-0 left-0 p-5 z-10">
        <p className="text-[0.65rem] font-bold tracking-[0.15em] uppercase text-purple-400 mb-1 flex items-center gap-1.5">
          <FaLocationDot className="w-3 h-3" />
          Base of Operations
        </p>
        <h3 className="text-xl font-bold text-white leading-tight mb-0.5">Los Angeles, CA</h3>
        <p className="text-xs text-slate-400">PST Timezone</p>
        <p className="text-xs text-cyan-400/80 font-medium mt-1">Ready to build.</p>
      </div>
    </div>
  )
}

export default LACard
