import sizes from './sizes'

const rawSpacing = {
  xxs: sizes.b1,
  xs: sizes.b2,
  s: sizes.b3,
  m: sizes.b4,
  l: sizes.b5,
  xl: sizes.b6,
  xxl: sizes.b8,
  xxxl: sizes.b10,
  xxxxl: sizes.b12,
  xxxxxl: sizes.b16,
}

type Size = keyof typeof rawSpacing

const spacing = Object.keys(rawSpacing).reduce((acc, key) => {
  acc[key as Size] = `${rawSpacing[key as Size]}px`
  return acc
}, {} as Record<Size, string>)

export default spacing
