import { logger } from '@/lib/logger'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * Cloudflare Turnstile Verification
 * Validates Turnstile tokens to prevent bot submissions.
 * Turnstile has no score: a successful verification on an allowed hostname
 * is sufficient.
 */

/**
 * Turnstile siteverify API response structure
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
interface TurnstileResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
  'error-codes'?: string[]
}

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const SITEVERIFY_TIMEOUT_MS = 5000

// Cloudflare's always-pass test secret reports this hostname.
const TEST_KEY_HOSTNAME = 'example.com'

/**
 * Hostnames a token may have been issued on. Defaults to the site's host and
 * its www variant; TURNSTILE_ALLOWED_HOSTNAMES (comma-separated) overrides.
 */
function allowedHostnames(): Set<string> {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTNAMES
  const hosts = configured
    ? configured.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
    : (() => {
        const host = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://n8builds.dev').hostname
        return [host, `www.${host.replace(/^www\./, '')}`]
      })()

  if (isContactTestMode()) hosts.push(TEST_KEY_HOSTNAME)
  return new Set(hosts)
}

/**
 * Verify a Cloudflare Turnstile token with Cloudflare's siteverify API.
 *
 * - Skipped only under `next dev`; every production build verifies.
 * - Fails closed: a missing secret, network error, timeout, or token issued on
 *   another hostname all reject.
 *
 * @param token - Turnstile token from client
 * @param remoteIp - Client IP, passed along so Cloudflare can cross-check it
 * @returns true if verification succeeds, false otherwise
 */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    logger.info('🔐 Development mode: Skipping Turnstile verification')
    return true
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    logger.error('❌ TURNSTILE_SECRET_KEY is not set - rejecting submission')
    return false
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp)

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    })

    const data: TurnstileResponse = await response.json()
    const hostname = data.hostname?.toLowerCase()
    const hostnameAllowed = hostname !== undefined && allowedHostnames().has(hostname)
    const isValid = data.success === true && hostnameAllowed

    if (data.success && !hostnameAllowed) {
      logger.warn('❌ Turnstile token issued on unexpected hostname:', data.hostname)
    }

    logger.info('🔐 Turnstile verification:', {
      success: data.success,
      hostname: data.hostname,
      errorCodes: data['error-codes'],
      isValid,
    })

    return isValid
  } catch (error) {
    logger.error('❌ Turnstile verification error:', error)
    return false
  }
}

/**
 * Validate honeypot field
 * Honeypot is a hidden field that should remain empty
 * Bots often fill all fields automatically, revealing themselves
 *
 * @param honeypot - Value from honeypot field (should be empty string)
 * @returns true if honeypot is empty (valid submission), false if filled (bot detected)
 *
 * @example
 * ```ts
 * if (!validateHoneypot(formData.honeypot)) {
 *   return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
 * }
 * ```
 */
export function validateHoneypot(honeypot: string | undefined): boolean {
  if (honeypot && honeypot.length > 0) {
    logger.warn('🤖 Bot detected via honeypot field')
    return false
  }
  return true
}
