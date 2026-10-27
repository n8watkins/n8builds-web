'use client'
import React from 'react'
import Marquee from '@/components/magicui/marquee'
import StackTile from '@/components/ui/StackTile'
import DinoEasterEgg from '@/components/features/dino/DinoEasterEgg'
import { ai_agents, ai_tools } from '@/data/aiStack'

/**
 * The homepage's AI kit marquee, with calm tiles that don't react to the
 * pointer. `dino` adds the easter egg (a pixel dino walking the rows, see
 * components/features/dino/).
 *
 * While the rows move, the tiles sit well apart (2.5rem across and between
 * the rows' tiles) so the gaps read clearly wider than the dino that hops and
 * falls through them; the dino's jumps are sized from the measured gaps.
 * Under reduced motion (no dino, the tiles wrap into a grid) they keep the
 * tighter default spacing.
 */
export function AITechStack({ dino = false }: { dino?: boolean }) {
  return (
    <div
      data-dino-panel={dino || undefined}
      className="relative flex w-full flex-col items-center justify-center overflow-hidden select-none [-webkit-tap-highlight-color:transparent] motion-safe:gap-6 rounded-3xl border border-white/6 bg-linear-to-br from-[#081427] via-[#0a1a33] to-[#081427] py-8 motion-safe:py-12"
    >
      <Marquee label="AI agents" reverse pauseOnHover data-marquee-row className="[--duration:45s] motion-safe:[--gap:2.5rem]">
        {ai_agents.map((tech) => (
          <StackTile
            key={tech.name}
            name={tech.name}
            icon={tech.icon}
            description={tech.description}
            still
          />
        ))}
      </Marquee>
      <Marquee label="AI tools" pauseOnHover data-marquee-row className="[--duration:45s] motion-safe:[--gap:2.5rem]">
        {ai_tools.map((tech) => (
          <StackTile
            key={tech.name}
            name={tech.name}
            icon={tech.icon}
            description={tech.description}
            still
          />
        ))}
      </Marquee>
      {dino && <DinoEasterEgg />}
      <div className="pointer-events-none absolute left-0 h-full w-1/4 bg-linear-to-r from-[#081427] to-transparent motion-reduce:hidden" />
      <div className="pointer-events-none absolute right-0 h-full w-1/4 bg-linear-to-l from-[#081427] to-transparent motion-reduce:hidden" />
    </div>
  )
}

export default AITechStack
