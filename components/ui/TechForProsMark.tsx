import Image from 'next/image'
import { TECH_FOR_PROS } from '@/lib/techForPros'

/**
 * Tech for Pros' icon on a light rounded tile, like an app icon: straight on
 * the site's dark navy, the icon's navy outlines vanish and the worker reads
 * as loose white shapes. `className` sizes the tile (h-7 w-7, say); the icon
 * fills it, inset a little. Decorative: the link or heading beside it names it.
 */
export default function TechForProsMark({ className = 'h-7 w-7', sizes = '28px' }: { className?: string; sizes?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-[28%] bg-slate-50 shadow-md shadow-black/30 ring-1 ring-white/30 ${className}`}
    >
      <Image src={TECH_FOR_PROS.icon} alt="" width={256} height={256} sizes={sizes} className="h-[84%] w-[84%]" />
    </span>
  )
}
