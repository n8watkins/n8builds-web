import { logger } from '@/lib/logger'

/**
 * Cloudflare Turnstile Verification
 * Validates Turnstile tokens to prevent bot submissions.
 * Turnstile has no score — a successful verification (success === true) is
 * sufficient.
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

/**
 * Verify a Cloudflare Turnstile token with Cloudflare's siteverify API.
 * Skips verification in development mode for easier testing.
 *
 * @param token - Turnstile token from client
 * @returns true if verification succeeds, false otherwise
 *
 * @example
 * ```ts
 * const isValid = await verifyTurnstile(token)
 * if (!isValid) {
 *   return NextResponse.json({ error: 'Turnstile failed' }, { status: 400 })
 * }
 * ```
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  // Skip Turnstile verification in development mode
  if (process.env.NODE_ENV === 'development') {
    logger.info('🔐 Development mode: Skipping Turnstile verification')
    return true
  }

  // No keys configured yet (pre-launch state): honeypot + rate limiting still apply
  if (!process.env.TURNSTILE_SECRET_KEY) {
    logger.warn('⚠️ TURNSTILE_SECRET_KEY not set, skipping verification (pre-launch)')
    return true
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    })

    const data: TurnstileResponse = await response.json()

    // Turnstile has no score — a successful verification is enough
    const isValid = data.success === true

    logger.info('🔐 Turnstile verification:', {
      success: data.success,
      hostname: data.hostname,
      action: data.action,
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
