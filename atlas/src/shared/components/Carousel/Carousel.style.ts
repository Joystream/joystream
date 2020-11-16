import styled from '@emotion/styled'
import Button from '../Button'

export const Container = styled.div`
  position: relative;
`

export const Arrow = styled(Button)`
  position: absolute;
  width: 48px;
  height: 48px;
  transition: none;

  &.disabled {
    opacity: 0;
  }

  &.glider-prev {
    left: 0;
  }
  &.glider-next {
    right: 0;
  }
`

export const GliderContainer = styled.div`
  scrollbar-width: none;
`
export const Track = styled.div<{ trackPadding: string }>`
  align-items: flex-start;
  padding: ${(props) => props.trackPadding};
`
