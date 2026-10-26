import type { IconType } from 'react-icons'
import { FaTwitch, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { FiGithub, FiMail } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { SiKofi } from 'react-icons/si'

/**
 * The owner's social links: one list for the contact card and the site
 * footer, in this order. Flip `enabled` to show or hide a link everywhere.
 * The streaming links (Twitch, YouTube) switch on once the owner starts
 * streaming (docs/DECISIONS.md, "Streaming"); the navbar's Twitch link is
 * separate (it carries the live dot).
 */
export interface Social {
  label: string
  href: string
  Icon: IconType
  enabled: boolean
  /** Optical size: some glyphs draw smaller or larger than the rest. */
  size: 'sm' | 'md' | 'lg'
}

export const ALL_SOCIALS: Social[] = [
  { label: 'GitHub', href: 'https://github.com/n8watkins', Icon: FiGithub, enabled: true, size: 'md' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/n8watkins/', Icon: CiLinkedin, enabled: true, size: 'lg' },
  { label: 'Email', href: 'mailto:contact@n8builds.dev', Icon: FiMail, enabled: true, size: 'md' },
  { label: 'X (Twitter)', href: 'https://x.com/n8watkins', Icon: FaXTwitter, enabled: true, size: 'sm' },
  { label: 'Twitch', href: 'https://twitch.tv/n8watkins', Icon: FaTwitch, enabled: false, size: 'sm' },
  // TODO(owner): PLACEHOLDER URL. @n8watkins is not a live channel yet (it
  // 404s); put the real channel URL here before enabling this for good.
  { label: 'YouTube', href: 'https://www.youtube.com/@n8watkins', Icon: FaYoutube, enabled: false, size: 'md' },
  { label: 'Ko-fi', href: 'https://ko-fi.com/n8watkins', Icon: SiKofi, enabled: true, size: 'md' },
]

/** The links to show (in ALL_SOCIALS order). */
export const SOCIALS = ALL_SOCIALS.filter((s) => s.enabled)

export const isExternal = (href: string) => href.startsWith('http')
