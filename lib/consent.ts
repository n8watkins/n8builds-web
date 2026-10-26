/**
 * Analytics consent (Google Consent Mode v2), region-aware.
 *
 * - Visitors whose browser time zone is in Europe (the EEA, the UK and
 *   Switzerland all sit in "Europe/..." zones, plus a few Atlantic and Arctic
 *   ones) are asked first: Google Analytics doesn't load at all until they
 *   accept, and never loads if they decline.
 * - Everyone else gets analytics by default, with "Cookie settings" in the
 *   footer to turn it off.
 * - Consent Mode's region defaults are the backstop when the time zone guess
 *   is wrong (a European IP with a non-European clock): Google itself treats
 *   analytics storage as denied for EEA, UK and Swiss IPs until consent.
 * - The site runs no ads, so the ad_* signals are denied everywhere.
 *
 * The bootstrap below is a tiny inline script in <head>, so the defaults are
 * in place before gtag.js can load; gtag.js itself still loads only after the
 * page has loaded and gone idle (what next/script's lazyOnload did before).
 */

export type ConsentChoice = 'granted' | 'denied'

/** localStorage key holding the visitor's choice ("granted" or "denied"). */
export const CONSENT_STORAGE_KEY = 'n8-analytics-consent'

/** Fired on window to open the consent banner (the footer's "Cookie settings"). */
export const CONSENT_OPEN_EVENT = 'n8:consent-open'

/** Fired on window after the choice changes; detail is the new ConsentChoice. */
export const CONSENT_CHANGE_EVENT = 'n8:consent-change'

/**
 * Where analytics needs opt-in consent: the EEA (EU 27 plus Iceland,
 * Liechtenstein, Norway), the United Kingdom and Switzerland, as ISO 3166-1
 * codes for gtag's `region` parameter.
 */
export const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
] as const

/** European time zones that don't start with "Europe/". */
export const EXTRA_CONSENT_TIME_ZONES = [
  'Atlantic/Reykjavik',
  'Atlantic/Canary',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'Atlantic/Faroe',
  'Arctic/Longyearbyen',
] as const

/** Whether a visitor in this IANA time zone should be asked before analytics. */
export function isConsentTimeZone(timeZone: string | undefined | null): boolean {
  if (!timeZone) return false
  return timeZone.startsWith('Europe/') || (EXTRA_CONSENT_TIME_ZONES as readonly string[]).includes(timeZone)
}

const DENIED_ADS = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

/**
 * The inline <head> script: sets the Consent Mode defaults, applies a stored
 * choice, configures GA, and loads gtag.js after load and idle when allowed.
 * It exposes `window.n8Consent` ({ state, ask, set }) for the banner.
 */
export function consentBootstrapScript(gaId: string): string {
  const regionDefault = { analytics_storage: 'denied', ...DENIED_ADS, region: CONSENT_REGIONS }
  const globalDefault = { analytics_storage: 'granted', ...DENIED_ADS, wait_for_update: 500 }
  return `(function(){
var w=window,d=document,id=${JSON.stringify(gaId)},K=${JSON.stringify(CONSENT_STORAGE_KEY)};
w.dataLayer=w.dataLayer||[];
function gtag(){w.dataLayer.push(arguments)}
w.gtag=gtag;
gtag('consent','default',${JSON.stringify(regionDefault)});
gtag('consent','default',${JSON.stringify(globalDefault)});
var c=null;try{c=w.localStorage.getItem(K)}catch(e){}
if(c!=='granted'&&c!=='denied')c=null;
var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
var ask=tz.indexOf('Europe/')===0||${JSON.stringify(EXTRA_CONSENT_TIME_ZONES)}.indexOf(tz)>-1;
if(c)gtag('consent','update',{analytics_storage:c});
gtag('js',new Date());
gtag('config',id);
var loaded=false;
function load(){if(loaded)return;loaded=true;var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);d.head.appendChild(s)}
function later(){var idle=w.requestIdleCallback||function(f){return setTimeout(f,1)};idle(load)}
function start(){if(d.readyState==='complete')later();else w.addEventListener('load',later,{once:true})}
function clearGa(){d.cookie.split(';').forEach(function(p){var n=p.split('=')[0].trim();if(n.indexOf('_ga')!==0)return;var h=location.hostname.split('.');for(var i=0;i<h.length;i++){var dom=h.slice(i).join('.');d.cookie=n+'=; Max-Age=0; path=/; domain='+dom;}d.cookie=n+'=; Max-Age=0; path=/'})}
var n8={state:c||(ask?'pending':'granted'),choice:c,ask:ask,set:function(v){try{w.localStorage.setItem(K,v)}catch(e){}n8.choice=v;n8.state=v;gtag('consent','update',{analytics_storage:v});if(v==='granted')start();else clearGa();try{w.dispatchEvent(new CustomEvent(${JSON.stringify(CONSENT_CHANGE_EVENT)},{detail:v}))}catch(e){}}};
w.n8Consent=n8;
if(n8.state==='granted')start();
})();`
}

export interface ConsentApi {
  /** "granted" or "denied" once known; "pending" while a European visitor hasn't chosen. */
  state: ConsentChoice | 'pending'
  /** The stored choice, or null when the visitor hasn't made one. */
  choice: ConsentChoice | null
  /** Whether this visitor is asked before analytics (European time zone). */
  ask: boolean
  /** Store and apply a choice (loads GA on "granted", clears GA cookies on "denied"). */
  set: (choice: ConsentChoice) => void
}

declare global {
  interface Window {
    n8Consent?: ConsentApi
  }
}

/** The consent API from the bootstrap script, or undefined (no GA configured, or on the server). */
export function getConsent(): ConsentApi | undefined {
  return typeof window === 'undefined' ? undefined : window.n8Consent
}
