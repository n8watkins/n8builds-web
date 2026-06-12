import type { GridItemConfig } from '@/lib/types/gridItem'

const buttonContainer = 'flex items-center justify-evenly z-50 w-full h-full pt-10'
const buttonClass =
  'inline-flex h-12 py-2 px-6 z-[5000] animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[length:200%_100%] font-medium text-slate-200 transition-transform focus:outline-none focus:ring-0 focus:ring-offset-slate-50 hover:scale-105 animate-duration-[3000ms]'

export const gridItem5: GridItemConfig = {
  id: 5,
  title: '',
  description: '',
  gridItemContainer: 'col-span-2 row-span-2 md:row-span-1 lg:col-span-2 xl:row-span-2',

  imgClassName: '',
  img: '',

  textContainerClassName: '',
  titleClassName: 'pt-16 h-40 rounded-b-3xl select-none',
  textOrder: '',

  buttonContainer,
  buttonClass,

  renderForeground: () => (
    <div className="absolute w-full h-full">
      <div className={buttonContainer}>
        <a
          href="https://github.com/n8watkins"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass + ' bg-[linear-gradient(45deg,#395bbf,45%,#5b93f5,55%,#3956a8)] dark:bg-[linear-gradient(45deg,#002aa3,45%,#0341ad,55%,#012485,80%,#002aa3)] gap-2'}
        >
          <span>★</span>
          GitHub Profile
        </a>
      </div>
    </div>
  ),
}
