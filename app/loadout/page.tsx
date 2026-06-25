import type { Metadata } from 'next'
import Loadout from '@/components/sections/Loadout'

export const metadata: Metadata = {
  title: 'The Loadout — n8builds',
  description:
    'The tools, stack, and rig I actually run while building software in public — and what I use each one for.',
  openGraph: {
    title: 'The Loadout — n8builds',
    description: 'The tools, stack, and rig I run — and what I use each one for.',
  },
}

export default function LoadoutPage() {
  return <Loadout />
}
