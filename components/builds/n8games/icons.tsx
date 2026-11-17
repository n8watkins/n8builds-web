import type { IconType } from 'react-icons'
import {
  LuBookOpen,
  LuCamera,
  LuCog,
  LuDrama,
  LuEye,
  LuFlaskConical,
  LuGauge,
  LuImage,
  LuLayers,
  LuMic,
  LuPalette,
  LuPlug,
  LuServer,
  LuShieldCheck,
  LuSmartphone,
  LuSmile,
  LuSquareStack,
  LuSun,
  LuUsers,
  LuVolume2,
  LuWifiOff,
} from 'react-icons/lu'
import type { MadeIcon } from '@/data/n8games/types'

/** The icon for each kind of "How it's made" item. */
export const MADE_ICONS: Record<MadeIcon, IconType> = {
  camera: LuCamera,
  sun: LuSun,
  cog: LuCog,
  server: LuServer,
  sound: LuVolume2,
  plug: LuPlug,
  mic: LuMic,
  offline: LuWifiOff,
  book: LuBookOpen,
  face: LuSmile,
  gauge: LuGauge,
  shield: LuShieldCheck,
  phone: LuSmartphone,
  image: LuImage,
  test: LuFlaskConical,
  palette: LuPalette,
  eye: LuEye,
  users: LuUsers,
  layers: LuLayers,
  mask: LuDrama,
  cards: LuSquareStack,
}

/** YouTube's mark, for links to Nick Saraev's channel and videos. */
export function YouTubeMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"
      />
    </svg>
  )
}

/** The back arrow, as in the preview. */
export function BackArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
