'use client'
import React, { ReactElement } from 'react'
import { cn } from '@/lib/utils'
import Marquee from '@/components/magicui/marquee'
import { ai_agents, ai_tools } from '@/data/aiStack'

// Ported from the portfolio's TechStack bento item (hover reveals the description),
// re-themed for the n8builds dark palette (cyan, no purple) with AI content.
const StackContainer = ({
  name,
  icon,
  description,
}: {
  name: string
  icon?: string | ReactElement
  description: string
}) => {
  return (
    <figure
      className={cn(
        'stack-container',
        'relative flex h-28 min-w-40 max-w-52 cursor-pointer items-center justify-center overflow-hidden rounded-xl border px-2 pb-2',
        'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-400/30',
        'transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-cyan-500/5',
        '[&_.content-wrapper]:hover:scale-75 [&_.content-wrapper]:hover:-translate-y-9',
        '[&_.description]:hover:opacity-100'
      )}
    >
      <div className="content-wrapper flex flex-col items-center transition-all duration-300 ease-in-out">
        <figcaption className="icon-name-wrapper mt-2 flex flex-col items-center text-xl font-medium text-white transition-all duration-300 ease-in-out">
          <div className="icon-name flex flex-row items-center gap-2 pt-24">
            <span className="icon transition-transform duration-300 ease-in-out">{icon}</span>
            <span className="name whitespace-nowrap transition-all duration-300 ease-in-out">{name}</span>
          </div>
          <div className="description flex h-24 w-48 items-start justify-center text-center text-sm text-[#9cadc5] opacity-0 transition-all duration-300 ease-in-out">
            {description}
          </div>
        </figcaption>
      </div>
    </figure>
  )
}

export function AITechStack() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#081427] via-[#0a1a33] to-[#081427] py-8">
      <Marquee reverse pauseOnHover className="[--duration:45s]">
        {ai_agents.map((tech) => (
          <StackContainer key={tech.name} name={tech.name} icon={tech.icon} description={tech.description} />
        ))}
      </Marquee>
      <Marquee pauseOnHover className="[--duration:45s]">
        {ai_tools.map((tech) => (
          <StackContainer key={tech.name} name={tech.name} icon={tech.icon} description={tech.description} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute left-0 h-full w-1/4 bg-gradient-to-r from-[#081427] to-transparent" />
      <div className="pointer-events-none absolute right-0 h-full w-1/4 bg-gradient-to-l from-[#081427] to-transparent" />
    </div>
  )
}

export default AITechStack
