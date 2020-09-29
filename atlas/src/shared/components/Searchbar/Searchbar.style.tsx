import styled from '@emotion/styled'
import { colors, sizes } from '../../theme'

export const Input = styled.input`
  border: unset;
  padding: 14px ${sizes.b3}px;
  height: ${sizes.b12}px;
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
