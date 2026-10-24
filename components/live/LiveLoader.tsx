'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { startLivePolling, useLiveStatus } from './liveStore'

// The player, and the platform iframes inside it, are downloaded only once
// /api/live says a stream is live: an offline page load fetches one small JSON
// answer after load and nothing else.
const LivePlayer = dynamic(() => import('./LivePlayer'), { ssr: false })

export default function LiveLoader() {
  const status = useLiveStatus()
  useEffect(() => startLivePolling(), [])
  if (!status?.live || status.streams.length === 0) return null
  return <LivePlayer status={status} />
}
