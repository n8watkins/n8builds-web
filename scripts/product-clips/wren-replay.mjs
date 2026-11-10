// Wren's live app as a guest, for its clip (record.mjs) and its screenshots
// (shots.mjs), without asking the live model anything.
//
// A guest's first message runs a Cloudflare Turnstile human check, which a
// recording must not get around (the same rule as the demo-kit's Wren
// storyboard, n8watkins/demo-kit). So the answer is replayed:
// fixtures/wren-answer-ebike.json is one genuine answer from Wren's own model
// (gemini-3.5-flash-lite, with Wren's own system prompt), captured once by the
// demo-kit with its chunk timing, and served in the browser for
// /api/guest/chat. The page, its code and its styles are the live app; nothing
// else on the network is reached (no Turnstile, no third parties).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const WREN = 'https://wren.n8builds.dev'

/** The recorded answer: its prompt and its chunks, each with its time in ms. */
export const wrenAnswer = () => JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures/wren-answer-ebike.json'), 'utf8'))

/**
 * Sets a browser context up as a returning guest (the first-visit "How Wren
 * works" dialog and the free-demo notice already closed: the build page says
 * what the notice says, and a feature screenshot shows it) whose question gets
 * the recorded answer at its recorded pace, slowed 1.5x to read, as the
 * demo-kit's take does.
 */
export async function replayWren(context, { returning = true } = {}) {
  await context.route('**/*', (route) => (new URL(route.request().url()).origin === WREN ? route.continue() : route.abort()))
  await context.addInitScript(
    ({ chunks, returning }) => {
      if (returning) {
        localStorage.setItem('wren:seen-how-it-works', '1')
        localStorage.setItem('wren:demo-notice-dismissed', '1')
      }
      const realFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (!url.includes('/api/guest/chat') || (init?.method ?? 'GET').toUpperCase() !== 'POST') return realFetch(input, init)
        const { text } = JSON.parse(String(init?.body ?? '{}'))
        const now = Date.now()
        const start = {
          t: 'start',
          chat: { id: 'guest', title: text.slice(0, 60), updatedAt: now },
          userMessage: { id: 'u1', role: 'user', content: text, status: 'done', createdAt: now },
          messageId: 'a1',
          keySource: 'demo',
          usage: {
            chat: { used: 1, limit: 5 },
            voiceMinutes: { used: 0, limit: 0 },
            research: { used: 0, limit: 0 },
            resetsAt: new Date(now + 86_400_000).toISOString(),
          },
        }
        const enc = new TextEncoder()
        const line = (event) => enc.encode(`${JSON.stringify(event)}\n`)
        const body = new ReadableStream({
          async start(controller) {
            controller.enqueue(line(start))
            await new Promise((r) => setTimeout(r, 250))
            let last = 0
            for (const chunk of chunks) {
              await new Promise((r) => setTimeout(r, (chunk.t - last) * 1.5))
              last = chunk.t
              controller.enqueue(line({ t: 'delta', text: chunk.text }))
            }
            controller.enqueue(line({ t: 'done', status: 'done' }))
            controller.close()
          },
        })
        return new Response(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } })
      }
    },
    { chunks: wrenAnswer().chunks, returning },
  )
}
