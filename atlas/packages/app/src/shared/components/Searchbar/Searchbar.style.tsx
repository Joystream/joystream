import styled from '@emotion/styled'
import { colors } from '../../theme'

export const Input = styled.input`
  border: unset;
  padding: 14px 12px;
  height: 48px;
  background-color: ${colors.gray[800]};
  color: ${colors.white};
  &::placeholder {
    color: ${colors.gray[400]};
  }
  &:focus {
    background-color: ${colors.gray[900]};
    outline: 1px solid ${colors.gray[500]};
  }
`
