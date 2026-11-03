// The contact form's and waitlist's rate limits (lib/security/rateLimiter.ts):
// one Durable Object per limit and key (an IP's /64, a recipient hash, "all"),
// so every request for that key is counted in one place, in order, however
// many Worker instances serve the site.
import { DurableObject } from 'cloudflare:workers'
import { slide } from './sliding-window.js'

export class RateLimitCounter extends DurableObject {
  /**
   * Counts one request; false when the limit is reached.
   * @param {number} max
   * @param {number} windowMs
   */
  async limit(max, windowMs) {
    const now = Date.now()
    const { allowed, hits } = slide((await this.ctx.storage.get('hits')) ?? [], now, max, windowMs)
    if (allowed) {
      await this.ctx.storage.put('hits', hits)
      // Every hit is out of the window by then: forget the key entirely.
      await this.ctx.storage.setAlarm(now + windowMs)
    }
    return allowed
  }

  async alarm() {
    await this.ctx.storage.deleteAll()
  }
}
