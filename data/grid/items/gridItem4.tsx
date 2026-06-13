import type { GridItemConfig } from '@/lib/types/gridItem'

const buttonContainer = 'flex items-center justify-evenly z-50 w-full h-full pb-14'
const buttonClass =
  'inline-flex h-12 py-2 px-6 z-[5000] animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[length:200%_100%] font-medium text-slate-200 transition-transform focus:outline-none focus:ring-0 focus:ring-offset-slate-50 hover:scale-105 animate-duration-[3000ms] cursor-pointer'

export const gridItem4: GridItemConfig = {
  id: 4,
  title: 'Need something built?',
  description: '',
  gridItemContainer:
    'col-span-2 row-span-1 md:col-span-2 lg:col-span-2 xl:row-span-2 xl:col-span-2 group',

  imgContainerClass: '',
  imgClassName: '',
  img: '',

  textContainerClassName:
    'flex items-center justify-start xs:pl-10 1sm:pl-5 w-full h-full whitespace-nowrap',

  textOrder:
    'group-hover:-translate-y-20 group-hover:translate-x-[3.5rem] 1sm:group-hover:translate-x-[0rem] sm:group-hover:translate-x-[5.5rem] duration-200 md:group-hover:translate-x-[1rem] xl:group-hover:translate-x-[3rem]',

  titleClassName:
    'flex transition duration-300 pt-[5rem] z-30 font-sans font-bold select-none text-slate-200 dark:text-neutral-200 text-2xl lg:text-3xl text-start w-full',

  buttonContainer,
  buttonClass,

  renderContent: () => (
    <div className={buttonContainer}>
      <a
        href="https://appturnity.com"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass + ' bg-[linear-gradient(45deg,#3956a8,45%,#5b93f5,55%,#3956a8)] dark:bg-[linear-gradient(45deg,#002aa3,45%,#0341ad,55%,#012485,80%,#002aa3)]'}
      >
        Appturnity ↗
      </a>
    </div>
  ),
}
