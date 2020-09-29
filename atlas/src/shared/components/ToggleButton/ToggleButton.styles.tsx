import styled from '@emotion/styled'
import { css } from '@emotion/core'

import Button from '../Button'
import type { ButtonStyleProps } from '../Button/Button.style'
import { spacing, colors } from '../../theme'

export type ToggleButtonStyleProps = {
  toggled: boolean
} & ButtonStyleProps

const hoverTransition = ({ toggled, disabled = false, variant }: ToggleButtonStyleProps) =>
  !toggled && !disabled
    ? css`
        &:hover {
          transform: translate3d(-${spacing.xxs}, -${spacing.xxs}, 0);
          box-shadow: ${spacing.xxs} ${spacing.xxs} 0 ${variant === 'primary' ? colors.blue[300] : colors.blue[500]};
          border-color: ${variant === 'primary' ? '' : colors.white};
          color: ${colors.white};
        }
      `
    : null

const pressed = ({ toggled }: ToggleButtonStyleProps) =>
  toggled
    ? css`
        border-color: ${colors.white};
        color: ${colors.white};
        background-color: ${colors.blue[500]};
        &:hover {
          background-color: ${colors.blue[700]};
        }
        &:active {
          background-color: ${colors.blue[900]};
        }
      `
    : null

const colorsFromProps = ({ variant, toggled }: ToggleButtonStyleProps) => {
  let styles
  switch (variant) {
    case 'tertiary': {
      styles = css`
        background-color: transparent;
        border-color: transparent;
        color: ${colors.blue[500]};
        &:hover {
          color: ${colors.blue[300]};
        }
        &:active {
          color: ${colors.blue[700]};
        }
      `
      break
    }
    case 'secondary': {
      styles = css`
        color: ${colors.white};
        background-color: ${toggled ? colors.blue[500] : colors.black};
        border-color: ${toggled ? colors.white : colors.blue[500]};
        &:hover {
          border-color: ${toggled ? colors.white : colors.blue[700]};
          color: ${toggled ? colors.white : colors.blue[300]};
          background-color: ${toggled ? colors.blue[700] : ''};
        }
        &:active {
          border-color: ${toggled ? colors.white : colors.blue[700]};
          color: ${toggled ? colors.white : colors.blue[700]};
        }
      `
      break
    }
    case 'primary':
    default: {
      styles = css`
        color: ${colors.white};
        background-color: ${colors.blue[500]};
        border-color: ${toggled ? colors.white : colors.blue[500]};
        &:hover {
          background-color: ${colors.blue[700]};
          border-color: ${toggled ? colors.white : colors.blue[700]};
          color: ${colors.white};
        }
        &:active {
          background-color: ${colors.blue[900]};
          border-color: ${toggled ? colors.white : colors.blue[900]};
          color: ${colors.white};
        }
      `
      break
    }
  }
  return styles
}

const disabled = ({ disabled }: ToggleButtonStyleProps) =>
  disabled
    ? css`
        box-shadow: none;
        fill: unset;
        stroke: unset;
        color: ${colors.white};
        background-color: ${colors.gray[100]};
        border-color: ${colors.gray[100]};
        &:hover {
          color: ${colors.white};
          background-color: ${colors.gray[100]};
          border-color: ${colors.gray[100]};
        }
        &:active {
          color: ${colors.white};
          background-color: ${colors.gray[100]};
          border-color: ${colors.gray[100]};
        }
      `
    : null

export const StyledToggleButton = styled(Button)`
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  ${colorsFromProps}
  ${pressed}
  ${hoverTransition}
  ${disabled}
`
