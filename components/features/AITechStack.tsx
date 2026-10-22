'use client'
import React from 'react'
import Marquee from '@/components/magicui/marquee'
import StackTile from '@/components/ui/StackTile'
import { ai_agents, ai_tools } from '@/data/aiStack'

export function AITechStack() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/6 bg-linear-to-br from-[#081427] via-[#0a1a33] to-[#081427] py-8">
      <Marquee label="AI agents" reverse pauseOnHover className="[--duration:45s]">
        {ai_agents.map((tech) => (
          <StackTile key={tech.name} name={tech.name} icon={tech.icon} description={tech.description} />
        ))}
      </Marquee>
      <Marquee label="AI tools" pauseOnHover className="[--duration:45s]">
        {ai_tools.map((tech) => (
          <StackTile key={tech.name} name={tech.name} icon={tech.icon} description={tech.description} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute left-0 h-full w-1/4 bg-linear-to-r from-[#081427] to-transparent motion-reduce:hidden" />
      <div className="pointer-events-none absolute right-0 h-full w-1/4 bg-linear-to-l from-[#081427] to-transparent motion-reduce:hidden" />
    </div>
  )
}

export default AITechStack
