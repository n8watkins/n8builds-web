'use client'
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'

import { techNameMapping } from '@/data/projects'
import { Technologies, TechNameMappingInterface } from '@/lib/types'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

interface TechStackCycleProps {
  technologies: Technologies
}

interface FlatIcon {
  icon: string
  category: keyof Technologies
  partIndex: number
}

const CYCLE_INTERVAL = 3000

const getTechName = (icon: string): string =>
  (techNameMapping as TechNameMappingInterface)[icon] || icon

const formatTechNames = (icons: string[]): string => {
  const names = icons.map(getTechName)
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1]
}

const TechStackCycle: React.FC<TechStackCycleProps> = ({ technologies }) => {
  const categories = useMemo(
    () => Object.keys(technologies) as (keyof Technologies)[],
    [technologies]
  )

  const allIcons = useMemo<FlatIcon[]>(
    () =>
      categories.flatMap((category) =>
        technologies[category].descriptionParts.flatMap((part, partIndex) =>
          part.icons.map((tech) => ({ icon: tech.icon, category, partIndex }))
        )
      ),
    [technologies, categories]
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIcons, setHoveredIcons] = useState<string[]>([])
  const pausedRef = useRef(false)
  const reduceMotion = usePrefersReducedMotion()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const active = allIcons[activeIndex] ?? allIcons[0]
  const currentCategory = active.category
  const highlightedPart = active.partIndex

  // Cycle only while on screen: inside a closed Details dialog it would
  // re-render every few seconds for no one.
  const root = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const startCycle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (reduceMotion || !visible) return
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setActiveIndex((prev) => (prev + 1) % allIcons.length)
      }
    }, CYCLE_INTERVAL)
  }, [allIcons.length, reduceMotion, visible])

  useEffect(() => {
    startCycle()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startCycle])

  const pause = useCallback(() => {
    pausedRef.current = true
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    setHoveredIcons([])
    startCycle()
  }, [startCycle])

  const jumpTo = useCallback(
    (predicate: (tech: FlatIcon) => boolean) => {
      const index = allIcons.findIndex(predicate)
      if (index !== -1) setActiveIndex(index)
    },
    [allIcons]
  )

  const handleCategoryClick = useCallback(
    (category: keyof Technologies) => {
      jumpTo((tech) => tech.category === category)
      setHoveredIcons([])
      startCycle()
    },
    [jumpTo, startCycle]
  )

  const handleIconHover = useCallback(
    (icon: string) => {
      pause()
      setHoveredIcons([icon])
      jumpTo((tech) => tech.icon === icon && tech.category === currentCategory)
    },
    [pause, jumpTo, currentCategory]
  )

  const handlePartHover = useCallback(
    (partIndex: number) => {
      pause()
      const icons = technologies[currentCategory].descriptionParts[partIndex].icons.map(
        (tech) => tech.icon
      )
      setHoveredIcons(icons)
      jumpTo((tech) => tech.category === currentCategory && tech.partIndex === partIndex)
    },
    [pause, technologies, currentCategory, jumpTo]
  )

  const categoryIcons = allIcons.filter((tech) => tech.category === currentCategory)
  const labelIcons = hoveredIcons.length > 0 ? hoveredIcons : active ? [active.icon] : []
  const label = formatTechNames(labelIcons)

  const isActive = (tech: FlatIcon) =>
    hoveredIcons.includes(tech.icon) || allIcons.indexOf(tech) === activeIndex

  return (
    <div ref={root} className="flex flex-col gap-3 select-none">
      {/* Category tabs */}
      <div className="flex items-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 ${
              category === currentCategory
                ? 'bg-blue-500/15 border-blue-400/40 text-blue-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/8 hover:text-slate-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Description bullets */}
      {/* The list slides in from the right when the category changes (a
          keyed CSS entrance, `slide-in` in app/globals.css; the animations
          here are CSS, so the Lab's Details dialogs don't load motion). Clip
          it sideways so the slide can't widen the page. */}
      <div className="min-h-22 overflow-x-clip">
        <ul key={currentCategory} className="slide-in flex flex-col gap-1">
          {technologies[currentCategory].descriptionParts.map((part, index) => (
            <li
              key={index}
              onMouseEnter={() => handlePartHover(index)}
              onMouseLeave={resume}
              className={`flex items-start gap-2 text-sm text-[#9cadc5] cursor-pointer rounded-lg px-2 py-1 w-fit max-w-[calc(100%-0.5rem)] transition-[translate,opacity] duration-200 ${
                index === highlightedPart ? 'translate-x-1.5 bg-blue-500/10 text-slate-200 opacity-100' : 'opacity-65'
              }`}
            >
              <span className="text-blue-400 shrink-0">•</span>
              <span>{part.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Icon dock */}
      <div className="flex items-end gap-3 h-14 pt-1">
        {categoryIcons.map((tech) => (
          <div
            key={`${currentCategory}-${tech.icon}`}
            onMouseEnter={() => handleIconHover(tech.icon)}
            onMouseLeave={resume}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-2 bg-[#0a1428] flex items-center justify-center cursor-pointer border transition-[scale,translate] duration-200 ${
              isActive(tech) ? 'z-10 -translate-y-1.25 scale-118 border-blue-400' : 'z-1 border-white/15'
            }`}
          >
            <div className="relative w-full h-full">
              <Image
                src={`/projectIcons/${tech.icon}`}
                alt={getTechName(tech.icon)}
                fill
                sizes="(max-width: 768px) 40px, 44px"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active tech name */}
      <div className="h-6">
        <p
          key={label}
          className="slide-in text-sm font-bold text-blue-300"
          style={{ animationDuration: '0.2s', ['--slide-from' as string]: '12px' }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}

export default TechStackCycle
