'use client'
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'

import { techNameMapping } from '@/data/projects'
import type { Technologies, TechnologyCategory, TechNameMappingInterface } from '@/lib/types'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { latestEntry } from '@/lib/intersection'

interface TechStackCycleProps {
  technologies: Technologies
  /**
   * The technologies whose categories size the explainer (this build's own by
   * default): each category is laid out invisibly in the same grid cell as the
   * one on show, so the explainer is as tall as its tallest category at any
   * width and never changes height as it cycles (owner, 2026-11-08).
   */
  sizers?: Technologies[]
}

interface FlatIcon {
  icon: string
  category: keyof Technologies
  partIndex: number
}

const CYCLE_INTERVAL = 3000

const getTechName = (icon: string): string =>
  (techNameMapping as TechNameMappingInterface)[icon] || icon

const TechStackCycle: React.FC<TechStackCycleProps> = ({ technologies, sizers = [technologies] }) => {
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

  // Cycle only while on screen: off screen it would re-render every few
  // seconds for no one.
  const root = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => setVisible(latestEntry(entries).isIntersecting))
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

  // Each tech once in the dock: two parts of a category can use the same one
  // (Next.js in both), and hovering it lights every part that uses it anyway.
  const categoryIcons = allIcons.filter(
    (tech, i) =>
      tech.category === currentCategory &&
      allIcons.findIndex((t) => t.category === currentCategory && t.icon === tech.icon) === i
  )

  const isActive = (tech: FlatIcon) =>
    hoveredIcons.includes(tech.icon) || allIcons[activeIndex]?.icon === tech.icon

  // Every category of every build, for the sizers: its parts and its dock's icons, once each.
  const sizerCategories = sizers.flatMap((techs) =>
    (Object.values(techs) as TechnologyCategory[]).map((category) => ({
      parts: category.descriptionParts.map((part) => part.text),
      icons: [...new Set(category.descriptionParts.flatMap((part) => part.icons.map((tech) => tech.icon)))],
    }))
  )
  // The cells the sizers share with what's on show: one grid area, every child in it.
  const stack = 'grid grid-cols-[minmax(0,1fr)] *:col-start-1 *:row-start-1'

  return (
    <div ref={root} className="flex flex-col items-center gap-4 select-none">
      {/* Category tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
              category === currentCategory
                ? 'bg-blue-500/15 border-blue-400/40 text-blue-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/8 hover:text-slate-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Description bullets, centred in the tallest list's space. The list
          slides in from the right when the category changes (a keyed CSS
          entrance, `slide-in` in app/globals.css). Clipped sideways so the
          slide can't widen the page. */}
      <div className={`${stack} w-full items-center justify-items-center overflow-x-clip`}>
        {sizerCategories.map((category, i) => (
          <ul key={i} aria-hidden="true" data-sizer className="invisible flex max-w-full flex-col gap-1">
            {category.parts.map((text, j) => (
              <li key={j} className={`${partClass} translate-x-1.5`}>
                <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        ))}
        <ul key={currentCategory} className="slide-in flex max-w-full flex-col gap-1">
          {technologies[currentCategory].descriptionParts.map((part, index) => (
            <li
              key={index}
              onMouseEnter={() => handlePartHover(index)}
              onMouseLeave={resume}
              className={`${partClass} cursor-pointer transition-[translate,opacity] duration-200 ${
                index === highlightedPart ? 'translate-x-1.5 bg-blue-500/10 text-slate-200 opacity-100' : 'opacity-65'
              }`}
            >
              {/* A dot centred on the first line of text. */}
              <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 -translate-y-1/2 rounded-full bg-blue-400" />
              <span>{part.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Icon dock: each tech's icon centred over its name. The active one
          lights up in place (no lift), so icons and names stay aligned. As
          tall as the fullest dock of any build. */}
      <div className={`${stack} w-full items-center pt-1`}>
        {sizerCategories.map((category, i) => (
          <ul key={i} aria-hidden="true" data-sizer className={`invisible ${dockClass}`}>
            {category.icons.map((icon) => (
              <li key={icon} className={dockItemClass}>
                <span className="h-12 w-12" />
                <span className="text-xs font-semibold leading-tight">{getTechName(icon)}</span>
              </li>
            ))}
          </ul>
        ))}
        <ul className={dockClass}>
          {categoryIcons.map((tech) => {
            const on = isActive(tech)
            return (
              <li
                key={`${currentCategory}-${tech.icon}`}
                onMouseEnter={() => handleIconHover(tech.icon)}
                onMouseLeave={resume}
                className={`${dockItemClass} cursor-pointer`}
              >
                <span
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border bg-[#0a1428] p-2.5 transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none ${
                    on ? 'border-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.18)]' : 'border-white/15'
                  }`}
                >
                  <span className="relative h-full w-full">
                    <Image src={`/projectIcons/${tech.icon}`} alt="" fill sizes="48px" style={{ objectFit: 'contain' }} />
                  </span>
                </span>
                <span className={`text-xs font-semibold leading-tight transition-colors duration-200 ${on ? 'text-blue-200' : 'text-slate-400'}`}>
                  {getTechName(tech.icon)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** A description part: its dot and text, as wide as its text. */
const partClass =
  'flex w-fit max-w-[calc(100%-0.5rem)] items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.95rem] leading-relaxed text-[#9cadc5]'
/** The dock: its icons in centred rows. */
const dockClass = 'flex flex-wrap items-start justify-center gap-x-2 gap-y-3'
const dockItemClass = 'flex w-20 flex-col items-center gap-1.5 text-center'

export default TechStackCycle
