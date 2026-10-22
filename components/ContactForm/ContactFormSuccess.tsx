'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'

// lottie-web is ~74 KB gzipped and only needed after a successful send, so the
// player and the confetti data load on demand instead of with the homepage.
// ContactFormLoading calls preloadConfetti() so both are ready by the time
// the success screen appears.
const loadConfetti = () => Promise.all([import('lottie-react'), import('@/data/confetti.json')])

export function preloadConfetti() {
  void loadConfetti()
}

const Confetti = dynamic(
  async () => {
    const [{ default: Lottie }, { default: confettiData }] = await loadConfetti()
    return function Confetti() {
      return <Lottie animationData={confettiData} loop={false} autoplay={true} style={{ height: 600, width: 600 }} />
    }
  },
  { ssr: false }
)

interface ContactFormSuccessProps {
  showConfetti: boolean
  confettiKey: number
  onSendAnother: () => void
}

export function ContactFormSuccess({ showConfetti, confettiKey, onSendAnother }: ContactFormSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center py-12 relative min-h-[600px] flex flex-col items-center justify-center"
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <motion.div
          key={confettiKey}
          className="absolute inset-0 pointer-events-none z-10 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <Confetti />
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="relative z-20"
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          🚀
        </motion.div>
        <motion.h3
          className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          Message sent successfully!
        </motion.h3>
        <motion.p
          className="text-slate-600 dark:text-slate-400 mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          I&apos;ll get back to you within 24 hours.
        </motion.p>
        <motion.button
          onClick={onSendAnother}
          className="text-purple-600 dark:text-purple-400 hover:underline transition-colors duration-200"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Send another message →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
