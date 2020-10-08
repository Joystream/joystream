import styled from '@emotion/styled'
import { colors, sizes } from '../../theme'
import Button from '../Button'

export const Input = styled.input`
  width: 100%;
  border: unset;
  padding: 14px ${sizes.b3}px;
  height: ${sizes.b12}px;
  background-color: ${colors.gray[800]};
  color: ${colors.white};
  ::placeholder {
    color: ${colors.gray[400]};
  }
  :focus {
    background-color: ${colors.gray[900]};
    outline: 1px solid ${colors.gray[500]};
  }
  &::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }
`

export const CancelButton = styled(Button)`
  position: absolute;
  right: 0;
  border: none;
  padding: 14px ${sizes.b3}px;
  color: ${colors.white};
  :focus,
  :hover {
    color: ${colors.white};
  }
  > svg {
    width: 100%;
    max-width: 17px;
    max-height: 17px;
  }
`

export const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: ${sizes.b12}px;
`
