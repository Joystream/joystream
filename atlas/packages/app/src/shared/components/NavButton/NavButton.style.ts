import styled from '@emotion/styled'
import { colors } from '../../theme'
import Button from '../Button'
export type NavButtonStyleProps = {
  variant: 'primary' | 'secondary'
}

export const StyledButton = styled(Button)`
  color: ${(props) => (props.variant === 'primary' ? colors.white : colors.gray[600])};
  background-color: ${(props) => (props.variant === 'primary' ? colors.blue[500] : 'transparent')};
  border: unset;
  width: 48px;
  height: 48px;
  &:hover {
    color: ${colors.white};
    background-color: ${(props) => (props.variant === 'primary' ? colors.blue[700] : 'transparent')};
  }
  &:active {
    background-color: ${(props) => (props.variant === 'primary' ? colors.blue[900] : 'transparent')};
  }
`
