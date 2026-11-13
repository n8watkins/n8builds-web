'use client'

import { useEffect, useState } from 'react'

/**
 * Whether the newsletter is live, for every form and mention of it on a page:
 * GET /api/newsletter/status (the owner's switch and Kit's setup), asked once
 * per page load and shared by every caller. Off until the answer says on, so
 * nothing shows while the switch is off, the answer is slow or it fails.
 */

let ask: Promise<boolean> | null = null

function status(): Promise<boolean> {
  ask ??= fetch('/api/newsletter/status')
    .then((r) => (r.ok ? r.json() : { on: false }))
    .then((b: { on?: unknown }) => b.on === true)
    .catch(() => false)
  return ask
}

export function useNewsletterOn(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let live = true
    status().then((v) => live && setOn(v))
    return () => {
      live = false
    }
  }, [])
  return on
}
