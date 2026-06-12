'use client'
import React from 'react'
import Marquee from '@/components/magicui/marquee'
import { FiGithub } from 'react-icons/fi'

interface ProjectCard {
  name: string
  description: string
  tags: string[]
  color: string
}

const projects: ProjectCard[] = [
  { name: 'Asset Arsenal', description: 'Brand asset generator', tags: ['Next.js', 'AI', 'TypeScript'], color: 'from-cyan-500/20 to-blue-600/20' },
  { name: 'ViBlog', description: 'Builder journal & stream tracker', tags: ['Next.js', 'Drizzle', 'Postgres'], color: 'from-blue-500/20 to-cyan-600/20' },
  { name: 'Chrome Extension Kit', description: 'Manifest V3 starter template', tags: ['Chrome API', 'TypeScript', 'MV3'], color: 'from-blue-500/20 to-cyan-600/20' },
  { name: 'Piper TTS', description: 'Local text-to-speech extension', tags: ['Python', 'Chrome', 'TTS'], color: 'from-green-500/20 to-teal-600/20' },
  { name: 'TLDW', description: 'YouTube summarizer extension', tags: ['Chrome', 'OpenAI', 'TypeScript'], color: 'from-orange-500/20 to-yellow-600/20' },
  { name: 'TubeVault', description: 'YouTube playlist manager', tags: ['Chrome', 'YouTube API', 'React'], color: 'from-red-500/20 to-rose-600/20' },
  { name: 'Appturnity', description: 'Software consulting platform', tags: ['Vite', 'Express', 'TypeScript'], color: 'from-sky-500/20 to-indigo-600/20' },
  { name: 'JobSignal', description: 'Job matching with AI embeddings', tags: ['Next.js', 'OpenAI', 'Supabase'], color: 'from-emerald-500/20 to-cyan-600/20' },
  { name: 'LocalDictate', description: 'Privacy-first local speech-to-text', tags: ['Tauri', 'Rust', 'Whisper'], color: 'from-slate-500/20 to-blue-600/20' },
  { name: 'Solara', description: 'Solar energy monitoring dashboard', tags: ['React', 'Charts', 'Node'], color: 'from-yellow-500/20 to-orange-600/20' },
  { name: 'Suggestion Box', description: 'Community feedback tool', tags: ['Next.js', 'Postgres', 'TypeScript'], color: 'from-cyan-500/20 to-blue-600/20' },
  { name: 'Repo Steward', description: 'GitHub repo health bot', tags: ['Node.js', 'GitHub API', 'Bot'], color: 'from-blue-500/20 to-indigo-600/20' },
]

const ProjectCard = ({ name, description, tags, color }: ProjectCard) => (
  <div className={`relative flex flex-col gap-2 w-[220px] mx-3 p-4 rounded-2xl border border-white/8 bg-gradient-to-br ${color} backdrop-blur-sm hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 cursor-default`}>
    <div className="flex items-start justify-between gap-2">
      <h4 className="font-bold text-sm text-slate-100 leading-tight">{name}</h4>
      <FiGithub className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
    </div>
    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{description}</p>
    <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
      {tags.map(tag => (
        <span key={tag} className="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-400">
          {tag}
        </span>
      ))}
    </div>
  </div>
)

const ProjectsMarquee = () => {
  const half = Math.ceil(projects.length / 2)
  const row1 = projects.slice(0, half)
  const row2 = projects.slice(half)

  return (
    <section className="py-14 overflow-hidden" aria-label="Projects showcase">
      <div className="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
              Builds from the{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">lab</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm md:text-base">
              Apps, agents, extensions, and local-AI experiments — built in the open, all on GitHub.
            </p>
          </div>
          <a
            href="https://github.com/n8watkins"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] flex-shrink-0"
          >
            <FiGithub className="w-4 h-4" />
            View all
          </a>
        </div>
      </div>

      <div className="relative">
        {/* Left/right fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#000319] to-transparent z-10 pointer-events-none dark:from-[#000319]" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#000319] to-transparent z-10 pointer-events-none dark:from-[#000319]" />

        <Marquee pauseOnHover repeat={3} className="[--duration:35s] py-2">
          {row1.map(p => <ProjectCard key={p.name} {...p} />)}
        </Marquee>
        <Marquee pauseOnHover reverse repeat={3} className="[--duration:38s] py-2">
          {row2.map(p => <ProjectCard key={p.name} {...p} />)}
        </Marquee>
      </div>
    </section>
  )
}

export default ProjectsMarquee
