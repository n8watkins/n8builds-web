import React from 'react'
import type { IconType } from 'react-icons'
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6'

/** Marks set right before a word of an action's label: the Windows logo by "Windows", and so on. */
const MARKS: Partial<Record<string, IconType>> = { Windows: FaWindows, Mac: FaApple, Linux: FaLinux }

/**
 * A button's label with a brand mark before the words that have one
 * ("Download for <Windows logo> Windows"), each mark kept on the line of its
 * word. Used by the Lab rows and the build pages.
 */
export default function ActionLabel({ label }: { label: string }) {
  const runs: { text: string; mark?: IconType }[] = []
  for (const token of label.split(/(\s+)/)) {
    const mark = MARKS[token.replace(/[^\w]/g, '')]
    const last = runs[runs.length - 1]
    if (mark) runs.push({ text: token, mark })
    else if (last && !last.mark) last.text += token
    else runs.push({ text: token })
  }
  return (
    <span>
      {runs.map((run, i) =>
        run.mark ? (
          <span key={i} className="whitespace-nowrap">
            <run.mark className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
            {run.text}
          </span>
        ) : (
          <React.Fragment key={i}>{run.text}</React.Fragment>
        )
      )}
    </span>
  )
}
