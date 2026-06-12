import GridPattern from '@/components/magicui/grid-pattern'
import type { GridItemConfig } from '@/lib/types/gridItem'

export const gridItem1: GridItemConfig = {
  id: 1,
  gridItemContainer:
    'col-span-2 row-span-4 h-[40rem] md:row-span-2 md:col-span-4 lg:col-span-2 lg:row-span-4 xl:col-span-4 md:h-[20rem] lg:h-[40rem] xl:h-[20rem] xl:w-[100%]',
  title: '',
  description: '',

  imgContainerClass: '',
  imgClassName: '',
  img: '',

  textContainerClassName: 'absolute inset-0 flex flex-col justify-center p-8 z-20',
  textOrder: '',
  titleClassName: '',
  descriptionClass: '',
  buttonContainer: '',
  buttonClass: '',

  renderBackground: () => (
    <div className="relative w-full h-full overflow-hidden">
      <GridPattern className="absolute inset-0 z-10 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/80 to-[#020621]/90 z-20" />
    </div>
  ),

  renderForeground: () => (
    <div className="absolute inset-0 flex flex-col justify-center p-7 z-30">
      <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-purple-400 mb-4">Build Philosophy</p>
      <div className="font-mono text-sm md:text-base leading-loose text-slate-300 space-y-1 select-none">
        <p><span className="text-cyan-400/70">&gt;</span> <span className="text-slate-200">idea</span></p>
        <p><span className="text-cyan-400/70">&gt;</span> <span className="text-slate-200">build</span></p>
        <p><span className="text-cyan-400/70">&gt;</span> <span className="text-slate-200">stream</span></p>
        <p><span className="text-cyan-400/70">&gt;</span> <span className="text-slate-200">ship</span></p>
        <p><span className="text-cyan-400/70">&gt;</span> <span className="text-slate-200">repeat</span></p>
      </div>
      <p className="font-mono text-[0.7rem] text-slate-600 mt-4 select-none"># public progress beats private perfection</p>
    </div>
  ),
}
