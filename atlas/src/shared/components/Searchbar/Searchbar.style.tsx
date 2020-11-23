import styled from '@emotion/styled'
import { colors, sizes } from '../../theme'
import Button from '../Button'
import { Icon } from '@/shared/components'

export const StyledIcon = styled(Icon)`
  height: 24px;
  color: ${colors.white};
`

export const Input = styled.input`
  width: 100%;
  height: 100%;
  border: unset;
  padding: 14px ${sizes.b3}px;
  background: none;
  color: ${colors.white};

  // override mobile Safari user agent styling
  border-radius: 0;
  -webkit-appearance: none;

  ::placeholder {
    color: ${colors.gray[300]};
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
  height: ${sizes.b1 * 14}px;
  background-color: ${colors.gray[800]};
  padding-left: ${sizes.b4}px;
  :focus-within {
    outline: 1px solid ${colors.gray[500]};
  }
`
