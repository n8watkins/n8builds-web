import { getCloudflareContext } from '@opennextjs/cloudflare'

/** The geolocation Cloudflare attaches to every request (request.cf). */
export interface RequestGeo {
  /** ISO 3166-1 alpha-2 country code. */
  country?: string
  /** ISO 3166-2 region code, without the country (CA, ENG). */
  regionCode?: string
}

/** The current request's geolocation, or undefined off Workers (next dev, next start, tests). */
export function requestGeo(): RequestGeo | undefined {
  try {
    return getCloudflareContext().cf as RequestGeo | undefined
  } catch {
    return undefined
  }
}
