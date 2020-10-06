import styled from '@emotion/styled'
import { css } from '@emotion/core'
import { colors } from '../../theme'

export type RadioButtonStyleProps = Partial<{
  error: boolean
  disabled: boolean
  clickable: boolean
  checked: boolean
  position: 'end' | 'start' | 'top' | 'bottom'
}>

export const Input = styled.input`
  margin: auto;
  opacity: 0;
`

const colorFromProps = ({ error, checked, disabled }: RadioButtonStyleProps) => {
  if (error) {
    return css`
      background-color: ${checked ? colors.error : 'transparent'};
      border: ${checked ? `2px solid ${colors.error}` : `1px solid ${colors.error}`};
    `
  } else if (disabled) {
    return css`
      background-color: ${checked ? colors.gray[200] : colors.gray[50]};
      border: ${checked ? `2px solid ${colors.gray[200]}` : `1px solid ${colors.gray[200]}`};
      background-clip: ${checked ? 'content-box' : 'unset'};
      &::before {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: ${checked ? colors.gray[50] : 'transparent'};
      }
    `
  } else {
    return css`
      border: ${checked ? `2px solid ${colors.blue[500]}` : `1px solid ${colors.gray[300]}`};
      background-color: ${checked ? colors.blue[500] : 'transparent'};
      &:hover {
        &::before {
          background-color: ${checked ? colors.blue[50] : colors.gray[50]};
        }
      }
      &:focus {
        border-color: ${checked ? 'transparent' : colors.gray[700]};
        &::before {
          background-color: ${checked ? colors.blue[100] : colors.gray[50]};
        }
      }
      &:active {
        border-color: ${checked ? '' : colors.gray[700]};
        &::before {
          background-color: ${checked ? colors.blue[100] : colors.gray[100]};
        }
      }
    `
  }
}

export const StyledInput = styled.div<RadioButtonStyleProps>`
  position: relative;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-clip: content-box;
  padding: 4px;
  &::before {
    content: '';
    top: -8px;
    bottom: -8px;
    left: -8px;
    right: -8px;
    border-radius: 50%;
    position: absolute;
    z-index: -1;
  }
  ${colorFromProps};
  & + span {
    color: ${(props) => (props.checked ? colors.white : '')};
  }
`

export const Label = styled.label<RadioButtonStyleProps>`
  width: min-content;
  display: flex;
  flex-direction: ${({ position }) => (position === 'start' || position === 'end' ? 'row' : 'column')};
  align-items: center;
  cursor: ${(props) => (props.clickable && !props.disabled ? 'pointer' : 'auto')};
  & > span:nth-of-type(1) {
    margin: 8px;
  }
  & > span {
    order: ${({ position }) => (position === 'start' || position === 'top' ? -1 : 1)};
  }
`
