'use client'

import Lottie from 'lottie-react'
import confettiData from '@/data/confetti.json'

/** The success-screen confetti. Loaded on demand; see ContactFormSuccess. */
export default function ConfettiPlayer() {
  return <Lottie animationData={confettiData} loop={false} autoplay={true} style={{ height: 600, width: 600 }} />
}
