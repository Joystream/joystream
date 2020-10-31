import styled from '@emotion/styled'
import Glider from 'react-glider'

import Icon from '../Icon'
import { colors } from '../../theme'

export const Container = styled.div<{ trackPadding: string }>`
  .glider-prev,
  .glider-next {
    position: absolute;

    display: grid;
    place-items: center;
    color: ${colors.white};
    background-color: ${colors.blue[500]};
    border: unset;
    width: 48px;
    height: 48px;
    transition: none;
    :hover {
      color: ${colors.white};
      background-color: ${colors.blue[700]};
    }
    :active {
      background-color: ${colors.blue[900]};
    }
  }
  .glider-prev.disabled,
  .glider-next.disabled {
    opacity: 0;
  }
  .glider-prev {
    left: 0;
  }
  .glider-next {
    right: 0;
  }

  .glider-track {
    padding: ${(props) => props.trackPadding};
  }
`

export const StyledGlider = styled(Glider)`
  scrollbar-width: none;
`
export const Arrow = styled(Icon)``
