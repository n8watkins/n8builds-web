import Navbar from '@/components/layout/Navbar'
import Loadout from '@/components/sections/Loadout'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'My Loadout | n8builds',
  description:
    'My dev setup (Windows 11, WSL2, Claude Code and Codex), the tools I built and the ones I use, then the rig and desk.',
  shareDescription: 'My dev setup, and the tools I built and use.',
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
