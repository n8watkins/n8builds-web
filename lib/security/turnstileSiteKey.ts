/**
 * Turnstile's public site key for a form, as every form here reads it: none
 * under `next dev` (the forms then skip the widget), else the build's
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 */
export function turnstileSiteKey(): string {
  return process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
}
