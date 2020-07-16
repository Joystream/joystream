// based on https://github.com/jonsuh/hamburgers licensed under MIT

import { makeStyles, StyleFn } from '../../utils'
import { colors } from '../../theme'

type HamburgerButtonStyleProps = {
  active: boolean
}

const hamburgerBox: StyleFn = () => ({
  width: '18px',
  height: '12px',
  display: 'inline-block',
  position: 'relative',
})

const hamburgerInner: StyleFn<HamburgerButtonStyleProps> = (_, { active }) => ({
  display: 'block',
  top: '50%',
  marginTop: '-1px',

  transitionDuration: '0.075s',
  transitionDelay: active ? '0.12s' : '0',
  transitionTimingFunction: active ? 'cubic-bezier(0.215, 0.61, 0.355, 1)' : 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  transform: active ? 'rotate(45deg)' : 'none',
  '&, &::before, &::after': {
    width: '18px',
    height: '2px',
    backgroundColor: colors.white,
    position: 'absolute',
  },
  '&::before, &::after': {
    content: '""',
    display: 'block',
  },
  '&::before': {
    top: active ? 0 : '-5px',
    opacity: active ? 0 : 1,
    transition: active ? 'top 0.075s ease, opacity 0.075s 0.12s ease' : 'top 0.075s 0.12s ease, opacity 0.075s ease',
  },
  '&::after': {
    bottom: active ? 0 : '-5px',
    transform: active ? 'rotate(-90deg)' : 'none',
    transition: active
      ? 'bottom 0.075s ease, transform 0.075s 0.12s cubic-bezier(0.215, 0.61, 0.355, 1)'
      : 'bottom 0.075s 0.12s ease, transform 0.075s cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  },
})

const hamburger: StyleFn = () => ({
  padding: '3px',
  display: 'inline-block',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.7,
  },
})

export const useCSS = (props: HamburgerButtonStyleProps) => ({
  hamburgerBox: makeStyles([hamburgerBox])(props),
  hamburgerInner: makeStyles([hamburgerInner])(props),
  hamburger: makeStyles([hamburger])(props),
})
