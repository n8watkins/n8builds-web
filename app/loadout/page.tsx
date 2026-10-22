import Navbar from '@/components/layout/Navbar'
import Loadout from '@/components/sections/Loadout'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'The Loadout — n8builds',
  description:
    'The tools, stack, and rig I actually run while building software in public — and what I use each one for.',
  shareDescription: 'The tools, stack, and rig I run — and what I use each one for.',
  path: '/loadout',
})

export default function LoadoutPage() {
  return (
    <>
      <Navbar />
      <Loadout />
    </>
  )
}
