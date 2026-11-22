/**
 * The visitor's OS, as `usePlatform` (hooks/usePlatform.ts) reads it: init scripts
 * that give the page a client hint, which wins over the user agent string. For a
 * page.addInitScript() before the first goto, so a spec about one OS's download
 * sees that OS in every browser project (WebKit's own user agent is a Mac's, and
 * a phone project's is a phone's).
 */
export const asWindows = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'Windows' }) })
export const asMac = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'macOS' }) })
export const asLinux = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'Linux' }) })
export const asPhone = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'Android', mobile: true }) })
