'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiCheckCircle } from 'react-icons/fi'
import { cn } from '@/lib/utils'

type Project = { slug: string; name: string; tagline: string; icon: string; confirmed: boolean }

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; projects: Project[] }
  | { kind: 'saving'; projects: Project[] }
  | { kind: 'done'; message: string; projects: Project[] }
  | { kind: 'error'; message: string }

const FALLBACK_ERROR = 'Something went wrong. Please try again, or email me at contact@n8builds.dev.'

async function manage(body: object): Promise<{ ok: boolean; data: { projects?: Project[]; error?: unknown } }> {
  const response = await fetch('/api/waitlist/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { ok: response.ok, data: await response.json().catch(() => ({})) }
}

/**
 * The manage page behind an email's leave link: the projects the address is
 * on, a checkbox each, and leaving altogether. No login: the link's token is
 * the proof, and it does only this (app/api/waitlist/manage).
 */
export default function ManageWaitlist({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [keep, setKeep] = useState<Set<string>>(new Set())

  useEffect(() => {
    let live = true
    manage({ token })
      .then(({ ok, data }) => {
        if (!live) return
        if (ok && data.projects) {
          setState({ kind: 'ready', projects: data.projects })
          setKeep(new Set(data.projects.map((p) => p.slug)))
        } else setState({ kind: 'error', message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR })
      })
      .catch(() => live && setState({ kind: 'error', message: FALLBACK_ERROR }))
    return () => {
      live = false
    }
  }, [token])

  const save = async (slugs: string[], projects: Project[]) => {
    setState({ kind: 'saving', projects })
    try {
      const { ok, data } = await manage({ token, keep: slugs })
      if (!ok) return setState({ kind: 'error', message: typeof data.error === 'string' ? data.error : FALLBACK_ERROR })
      const left = data.projects ?? []
      if (left.length === 0) {
        return setState({ kind: 'done', projects: [], message: 'Done: you have left the waitlist, and your address and everything stored with it are deleted.' })
      }
      setKeep(new Set(left.map((p) => p.slug)))
      setState({ kind: 'done', projects: left, message: `Saved. You're on the list for ${left.map((p) => p.name).join(', ')}.` })
    } catch {
      setState({ kind: 'error', message: FALLBACK_ERROR })
    }
  }

  if (state.kind === 'loading') return <div className="h-40" aria-hidden />

  if (state.kind === 'error') {
    return (
      <div className="space-y-4">
        <p role="alert" className="fade-in rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm leading-relaxed text-red-200">
          {state.message}
        </p>
        <Link href="/upcoming" className="inline-block text-sm text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
          Back to the upcoming projects
        </Link>
      </div>
    )
  }

  const { projects } = state
  const busy = state.kind === 'saving'
  const changed = projects.length !== keep.size || projects.some((p) => !keep.has(p.slug))

  return (
    <div className="space-y-6">
      {state.kind === 'done' && (
        <div role="status" className="fade-in flex items-start gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/8 p-4">
          <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
          <p className="text-slate-100">{state.message}</p>
        </div>
      )}
      {projects.length > 0 && (
        <>
          <p className="leading-relaxed text-slate-300">Untick a project to stop hearing about it, or leave the waitlist altogether.</p>
          <fieldset className="space-y-3" disabled={busy}>
            <legend className="sr-only">Projects you&rsquo;re on</legend>
            {projects.map((p) => {
              const on = keep.has(p.slug)
              return (
                <label
                  key={p.slug}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors',
                    on ? 'border-cyan-400/30 bg-slate-800/60' : 'border-slate-700 bg-slate-900/40 opacity-70'
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-cyan-500"
                    checked={on}
                    onChange={(e) => {
                      const next = new Set(keep)
                      if (e.target.checked) next.add(p.slug)
                      else next.delete(p.slug)
                      setKeep(next)
                    }}
                  />
                  <Image src={p.icon} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-[10px]" unoptimized />
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-50">{p.name}</span>
                    <span className="block text-sm leading-snug text-slate-400">{p.tagline}</span>
                    {!p.confirmed && <span className="mt-1 block text-xs text-slate-500">Not confirmed yet</span>}
                  </span>
                </label>
              )
            })}
          </fieldset>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy || !changed || keep.size === 0}
              onClick={() => save([...keep], projects)}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-linear-to-r from-cyan-600 to-blue-700 px-6 text-sm font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Saving...' : 'Save my choices'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => save([], projects)}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600 px-6 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/60 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Leave the waitlist
            </button>
          </div>
        </>
      )}
      {projects.length === 0 && (
        <Link href="/upcoming" className="inline-block text-sm text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
          Back to the upcoming projects
        </Link>
      )}
    </div>
  )
}
