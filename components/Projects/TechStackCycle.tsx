'use client'
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'

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

  const startCycle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (reduceMotion) return
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setActiveIndex((prev) => (prev + 1) % allIcons.length)
      }
    }, CYCLE_INTERVAL)
  }, [allIcons.length, reduceMotion])

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
    <div className="flex flex-col gap-3 select-none">
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
      {/* The list slides in from the right when the category changes. Clip it
          sideways so the slide can't widen the page, and skip the slide on the
          first render, where the server HTML would hold the offset until hydration. */}
      <div className="min-h-22 overflow-x-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={currentCategory}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-1"
          >
            {technologies[currentCategory].descriptionParts.map((part, index) => (
              <motion.li
                key={index}
                onMouseEnter={() => handlePartHover(index)}
                onMouseLeave={resume}
                animate={{
                  x: index === highlightedPart ? 6 : 0,
                  opacity: index === highlightedPart ? 1 : 0.65,
                }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-2 text-sm text-[#9cadc5] cursor-pointer rounded-lg px-2 py-1 w-fit max-w-[calc(100%-0.5rem)] ${
                  index === highlightedPart ? 'bg-blue-500/10 text-slate-200' : ''
                }`}
              >
                <span className="text-blue-400 shrink-0">•</span>
                <span>{part.text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* Icon dock */}
      <div className="flex items-end gap-3 h-14 pt-1">
        {categoryIcons.map((tech) => (
          <motion.div
            key={`${currentCategory}-${tech.icon}`}
            onMouseEnter={() => handleIconHover(tech.icon)}
            onMouseLeave={resume}
            animate={{
              scale: isActive(tech) ? 1.18 : 1,
              y: isActive(tech) ? -5 : 0,
              zIndex: isActive(tech) ? 10 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-2 bg-[#0a1428] flex items-center justify-center cursor-pointer border ${
              isActive(tech) ? 'border-blue-400' : 'border-white/15'
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
          </motion.div>
        ))}
      </div>

      {/* Active tech name */}
      <div className="h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-bold text-blue-300"
          >
            {label}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TechStackCycle
