import { css } from '@emotion/core'
import styled from '@emotion/styled'
import Icon from '../Icon'
import { colors, typography } from '../../theme'

export type ButtonStyleProps = {
  variant?: 'primary' | 'secondary' | 'tertiary'
  full?: boolean
  size?: 'regular' | 'small' | 'smaller'
  disabled?: boolean
  hasText?: boolean
  clickable?: boolean
}

const colorsFromProps = ({ variant }: ButtonStyleProps) => {
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
        background-color: ${colors.black};
        border-color: ${colors.blue[500]};
        &:hover {
          border-color: ${colors.blue[700]};
          color: ${colors.blue[300]};
        }
        &:active {
          border-color: ${colors.blue[700]};
          color: ${colors.blue[700]};
        }
      `
      break
    }
    case 'primary':
    default: {
      styles = css`
        color: ${colors.white};
        background-color: ${colors.blue[500]};
        border-color: ${colors.blue[500]};
        &:hover {
          background-color: ${colors.blue[700]};
          border-color: ${colors.blue[700]};
          color: ${colors.white};
        }
        &:active {
          background-color: ${colors.blue[900]};
          border-color: ${colors.blue[900]};
          color: ${colors.white};
        }
      `
      break
    }
  }
  return styles
}

const sizeFromProps = ({ size = 'regular', full, hasText }: ButtonStyleProps) => {
  let padding, fontSize
  switch (size) {
    case 'smaller': {
      padding = '10px'
      fontSize = typography.sizes.button.small
      break
    }
    case 'small': {
      padding = hasText ? `12px 14px` : '12px'
      fontSize = typography.sizes.button.medium
      break
    }
    case 'regular':
    default: {
      padding = hasText ? `14px 20px` : '14px'
      fontSize = typography.sizes.button.large
      break
    }
  }
  return css`
    width: ${full ? '100%' : ''};
    display: ${full ? 'flex' : 'inline-flex'};
    font-size: ${fontSize};
    padding: ${padding};
  `
}

const disabled = ({ disabled }: ButtonStyleProps) =>
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

export const StyledIcon = styled(Icon)`
  flex-shrink: 0;
  & > * {
    stroke: currentColor;
  }
`
export const StyledButton = styled.button<ButtonStyleProps>`
	border-width: 1px;
	border-style: solid;
	font-family: ${typography.fonts.headers};
	font-weight: ${typography.weights.medium};
	display: inline-flex;
	justify-content: center;
	align-items: center;
	&:hover {
		cursor: ${(props) => (!props.disabled && props.clickable ? 'pointer' : '')}
	}
  &:focus {
    outline: 0
  }
	&::selected {
		background: transparent;
	}
	${colorsFromProps}
	${sizeFromProps}
	${disabled}
	& > ${StyledIcon} {
		font-size: ${({ size }) =>
      size === 'regular'
        ? typography.sizes.icon.large
        : size === 'small'
        ? typography.sizes.icon.medium
        : typography.sizes.icon.small};
		& + * {
			margin-left: 10px
		}
	};`
