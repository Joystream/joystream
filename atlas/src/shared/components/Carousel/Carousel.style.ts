import styled from '@emotion/styled'
import Button from '../Button'

export const FADE_COLOR = 'black'
export const Container = styled.div`
  --prev-arrow-color: transparent;
  --next-arrow-color: ${FADE_COLOR};
  position: relative;

  ::after {
    content: '';
    position: absolute;
    top: 0;
    left: calc(-1 * var(--global-horizontal-padding));
    bottom: 0;
    right: calc(-1 * var(--global-horizontal-padding));
    background-image: linear-gradient(90deg, transparent 75%, var(--next-arrow-color)),
      linear-gradient(270deg, transparent 75%, var(--prev-arrow-color));
    pointer-events: none;
    transition: background-image 0.2s;
  }
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
