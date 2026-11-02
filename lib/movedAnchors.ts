/**
 * Old homepage anchors that now live on another page. The Lab's "My tools"
 * part (/#my-tools) moved to /loadout's "Tools I built and use" (2026-11-01).
 * A hash never reaches the server, so the root layout runs MY_TOOLS_MOVED in
 * its head on a full load (before anything paints), and HomeEffects checks
 * on a client-side arrival at the homepage.
 */
export const MY_TOOLS_HASH = '#my-tools'
export const MY_TOOLS_TARGET = '/loadout#tools-i-built'
export const MY_TOOLS_MOVED = `if(location.pathname==='/'&&location.hash===${JSON.stringify(MY_TOOLS_HASH)})location.replace(${JSON.stringify(MY_TOOLS_TARGET)})`
