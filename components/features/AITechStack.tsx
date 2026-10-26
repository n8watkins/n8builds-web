'use client'
import React from 'react'
import Marquee from '@/components/magicui/marquee'
import StackTile from '@/components/ui/StackTile'
import DinoEasterEgg from '@/components/features/dino/DinoEasterEgg'
import { ai_agents, ai_tools } from '@/data/aiStack'

/**
 * The AI kit marquee. `dino` adds the homepage's easter egg (a pixel dino
 * walking the rows, see components/features/dino/); /loadout leaves it off.
 *
 * The tiles sit well apart (3rem across, 3rem between the rows' tiles) so the gaps
 * read clearly wider than the dino that hops and falls through them; the
 * dino's jumps are sized from the measured gaps.
 */
export function AITechStack({ dino = false }: { dino?: boolean }) {
  return (
    <div
      data-dino-panel={dino || undefined}
      className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl border border-white/6 bg-linear-to-br from-[#081427] via-[#0a1a33] to-[#081427] py-12"
    >
      <Marquee label="AI agents" reverse pauseOnHover data-marquee-row className="[--duration:45s] [--gap:3rem]">
        {ai_agents.map((tech) => (
          <StackTile
            key={tech.name}
            name={tech.name}
            icon={tech.icon}
            description={tech.description}
          />
        ))}
      </Marquee>
      <Marquee label="AI tools" pauseOnHover data-marquee-row className="[--duration:45s] [--gap:3rem]">
        {ai_tools.map((tech) => (
          <StackTile
            key={tech.name}
            name={tech.name}
            icon={tech.icon}
            description={tech.description}
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
