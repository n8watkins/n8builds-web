import Navbar from '@/components/layout/Navbar'
import Loadout from '@/components/sections/Loadout'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'My Loadout | n8builds',
  description:
    'The AI I build with and what each one is for, the tools I use and the ones I built (pass-env, release-kit), the people I follow, then the rig and desk.',
  shareDescription: 'The AI I build with, the tools I use and built, and the people I follow.',
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
