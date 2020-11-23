export { ReactComponent as Bars } from './bars.svg'
export { ReactComponent as Home } from './home.svg'
export { ReactComponent as Binocular } from './binocular.svg'
export { ReactComponent as Browse } from './browse.svg'
export { ReactComponent as Books } from './books.svg'
export { ReactComponent as Block } from './block.svg'
export { ReactComponent as ChevronDown } from './chevron-down-big.svg'
export { ReactComponent as ChevronUp } from './chevron-up-big.svg'
export { ReactComponent as ChevronRight } from './chevron-right-big.svg'
export { ReactComponent as ChevronLeft } from './chevron-left-big.svg'
export { ReactComponent as Check } from './check.svg'
export { ReactComponent as Dash } from './dash.svg'
export { ReactComponent as Play } from './play.svg'
export { ReactComponent as PlayOutline } from './play-outline.svg'
export { ReactComponent as Pause } from './pause.svg'
export { ReactComponent as SoundOn } from './sound-on.svg'
export { ReactComponent as SoundOff } from './sound-off.svg'
export { ReactComponent as Times } from './times.svg'

const icons = [
  'bars',
  'home',
  'binocular',
  'browse',
  'books',
  'block',
  'chevron-down',
  'chevron-up',
  'chevron-right',
  'chevron-left',
  'check',
  'dash',
  'play',
  'play-outline',
  'pause',
  'sound-on',
  'sound-off',
  'times',
] as const

export type IconType = typeof icons[number]
