import LACard from '@/components/ui/BentoComponents/LACard'
import type { GridItemConfig } from '@/lib/types/gridItem'

export const gridItem2: GridItemConfig = {
  id: 2,
  title: '',
  description: '',
  gridItemContainer:
    'col-span-2 row-span-3 sm:row-span-3 md:col-span-2 lg:col-span-2 lg:row-span-3 xl:col-span-2 xl:row-span-6',

  imgContainerClass: '',
  imgClassName: '',
  img: '',

  textContainerClassName: '',
  titleClassName: '',
  textOrder: '',
  buttonContainer: '',
  buttonClass: '',

  renderBackground: () => <LACard />,
}
