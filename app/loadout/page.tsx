import Navbar from '@/components/layout/Navbar'
import Loadout from '@/components/sections/Loadout'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'The Loadout | n8builds',
  description:
    'The AI I build with and what each one is for: ChatGPT to decide, Claude Code to build, Codex and Gemini to fix, then the rig and desk.',
  shareDescription: 'The AI I build with and what each one is for, then the rig and desk.',
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
