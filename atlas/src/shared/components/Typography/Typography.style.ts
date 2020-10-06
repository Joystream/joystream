import { typography, colors } from '../../theme'

export type TypographyVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'overhead'

export const baseStyle = {
  fontFamily: typography.fonts.base,
  color: colors.white,
  margin: 0,
}

export const variantStyles = {
  hero: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.headers,
  },
  h1: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.headers,
  },

  h2: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.headers,
  },

  h3: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.headers,
  },

  h4: {
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.headers,
  },

  h5: {
    fontSize: typography.sizes.h5,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.headers,
  },

  h6: {
    fontSize: typography.sizes.h6,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.headers,
  },

  subtitle1: {
    fontSize: typography.sizes.subtitle1,
    fontWeight: typography.weights.light,
  },

  subtitle2: {
    fontSize: typography.sizes.subtitle2,
    fontWeight: typography.weights.regular,
  },

  body1: {
    fontSize: typography.sizes.body1,
    fontWeight: typography.weights.light,
  },

  body2: {
    fontSize: typography.sizes.body2,
    fontWeight: typography.weights.light,
  },

  caption: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.light,
  },

  overhead: {
    fontSize: typography.sizes.overhead,
    fontWeight: typography.weights.regular,
  },
}
