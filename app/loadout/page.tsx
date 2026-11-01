import Navbar from '@/components/layout/Navbar'
import Loadout from '@/components/sections/Loadout'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'My Loadout | n8builds',
  description:
    'My dev setup (Windows 11, WSL2, Claude Code and Codex), the tools I use and the ones I built, the people I follow, then the rig and desk.',
  shareDescription: 'My dev setup, the tools I use and built, and the people I follow.',
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
