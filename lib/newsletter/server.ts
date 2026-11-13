import { waitlistDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { kitClient, type KitClient } from '@/lib/newsletter/kit'
import { testKit } from '@/lib/newsletter/kitFake'
import { readSwitch } from '@/lib/newsletter/switch'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * The newsletter's server side: whether it is on, and the Kit client.
 *
 * It is on only when the owner's switch is on (lib/newsletter/switch.ts) and
 * Kit is set up (the KIT_API_KEY secret). In CONTACT_TEST_MODE the client is
 * the in-memory stand-in (lib/newsletter/kitFake.ts), and a test can turn the
 * newsletter on for its own requests with the cookie `n8-newsletter-test=on`,
 * so parallel tests that expect it off are never affected.
 */

export const TEST_SWITCH_COOKIE = 'n8-newsletter-test'

type CookieReader = { get(name: string): { value: string } | undefined }

let client: { key: string; kit: KitClient } | null = null
let onlyFormId: { key: string; id: string } | null = null

/** The Kit client, or null while Kit isn't set up. One per isolate, so its tag ids are remembered. */
export function kit(): KitClient | null {
  if (isContactTestMode()) {
    if (client?.key !== 'test') client = { key: 'test', kit: kitClient({ apiKey: 'test', base: 'https://kit.test/v4', fetch: testKit().fetch })! }
    return client.kit
  }
  const key = process.env.KIT_API_KEY?.trim() ?? ''
  if (!key) return null
  if (client?.key !== key) client = { key, kit: kitClient({ apiKey: key })! }
  return client.kit
}

/** The double opt-in form: KIT_FORM_ID, or the account's only active form. Null when neither says. */
export async function kitFormId(k: KitClient): Promise<string | null> {
  const configured = process.env.KIT_FORM_ID?.trim()
  if (configured && !isContactTestMode()) return configured
  const key = isContactTestMode() ? 'test' : (process.env.KIT_API_KEY ?? '')
  if (onlyFormId?.key === key) return onlyFormId.id
  const id = await k.onlyForm()
  if (id) onlyFormId = { key, id }
  return id
}

/** The owner's switch, or the test cookie's answer in test mode. Off when it can't be read. */
async function switchOn(cookies?: CookieReader): Promise<boolean> {
  if (isContactTestMode()) {
    const test = cookies?.get(TEST_SWITCH_COOKIE)?.value
    if (test === 'on') return true
    if (test === 'off') return false
  }
  const db = await waitlistDb()
  if (!db) return false
  try {
    return (await readSwitch(db)).on
  } catch (error) {
    // Before migration 0004 is applied the table isn't there: off.
    logger.warn('Newsletter switch unreadable:', error instanceof Error ? error.message : error)
    return false
  }
}

/** Whether the newsletter is live: the switch is on and Kit is set up. */
export async function newsletterOn(cookies?: CookieReader): Promise<boolean> {
  return Boolean(kit()) && (await switchOn(cookies))
}
