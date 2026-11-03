'use client'

import { LottieLight } from 'lottie-react'
import confettiData from '@/data/confetti.json'

/**
 * The success-screen confetti. Loaded on demand; see ContactFormSuccess.
 * LottieLight is the engine build without expressions (the animation has none)
 * and without eval, which the production CSP doesn't allow. Since lottie-react
 * 3, loop and autoplay default to false, so only autoplay is set.
 */
export default function ConfettiPlayer() {
  return <LottieLight src={confettiData} autoplay style={{ height: 600, width: 600 }} />
}
