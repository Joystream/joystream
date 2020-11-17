import styled from '@emotion/styled'
import Button from '../Button'

export const Container = styled.div`
  position: relative;
`

export const BackgroundGradient = styled.div<{ direction: 'prev' | 'next'; margin: string }>`
  position: absolute;
  top: 0;
  left: ${(props) => (props.direction === 'prev' ? 0 : 'auto')};
  right: ${(props) => (props.direction === 'next' ? 0 : 'auto')};
  bottom: 0;
  margin: ${(props) => props.margin};
  width: 10%;
  z-index: 1;
  background-image: linear-gradient(
    ${(props) => (props.direction === 'prev' ? 270 : 90)}deg,
    transparent,
    var(--gradientColor, transparent)
  );
  pointer-events: none;
`

export const Arrow = styled(Button)`
  position: absolute;
  width: 48px;
  height: 48px;
  transition: none;

  &.disabled {
    display: none;
  }

  &.glider-prev {
    left: 0;
  }
  &.glider-next {
    right: 0;
  }
  + ${BackgroundGradient} {
    --gradientColor: black;
  }
  &.disabled + ${BackgroundGradient} {
    --gradientColor: transparent;
  }
`

export const GliderContainer = styled.div<{ trackPadding: string; margin: string }>`
  scrollbar-width: none;
  padding: ${(props) => props.trackPadding};
  margin: ${(props) => props.margin};
`

export const Track = styled.div`
  align-items: flex-start;
`
