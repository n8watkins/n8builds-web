'use client'

import React, { useEffect } from 'react'
import { m } from 'motion/react'
import MotionProvider from '@/components/MotionProvider'
import { preloadConfetti } from './ContactFormSuccess'
// TODO: Download a loading animation from https://lottiefiles.com/free-animations/send-mail
// and save it as /data/loading-email.json
// For now, we'll show a placeholder
// import loadingData from '@/data/loading-email.json'

function ContactFormLoadingScreen() {
  // Fetch the success confetti while the message is sending.
  useEffect(preloadConfetti, [])

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center py-12 relative min-h-[600px] flex flex-col items-center justify-center"
    >
      {/* Animated dots - above the text */}
      <m.div
        className="flex gap-3 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {[0, 1, 2].map((i) => (
          <m.div
            key={i}
            className="w-4 h-4 bg-cyan-400 rounded-full"
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </m.div>

      {/* Lottie Animation - uncomment when you add the JSON file */}
      {/* <Lottie
        animationData={loadingData}
        loop={true}
        autoplay={true}
        style={{ height: 200, width: 200, marginBottom: '2rem' }}
      /> */}

      <m.h3
        className="text-2xl font-bold text-slate-800 dark:text-slate-200"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        Sending message...
      </m.h3>
    </m.div>
  )
}

/** Loaded on demand by the form (components/ContactForm/index.tsx), with its own motion setup. */
export function ContactFormLoading() {
  return (
    <MotionProvider>
      <ContactFormLoadingScreen />
    </MotionProvider>
  )
}
