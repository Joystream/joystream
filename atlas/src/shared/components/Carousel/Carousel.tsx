import { SerializedStyles } from '@emotion/core'
import React, { useRef } from 'react'

import { useGlider, GliderProps } from '../Glider'

import { Container, GliderContainer, Arrow, Track, BackgroundGradient } from './Carousel.style'

type CarouselProps = {
  trackPadding?: string
  className?: string
  arrowCss?: SerializedStyles
} & GliderProps

const Carousel: React.FC<CarouselProps> = ({
  children,
  trackPadding = '0',
  className = '',
  arrowCss,
  slidesToShow = 'auto',
  ...gliderOptions
}) => {
  const nextArrowRef = useRef<HTMLButtonElement>(null)
  const prevArrowRef = useRef<HTMLButtonElement>(null)
  const { ref, getContainerProps, getGliderProps, getTrackProps, getPrevArrowProps, getNextArrowProps } = useGlider<
    HTMLDivElement
  >({
    slidesToShow,
    arrows: { prev: prevArrowRef.current, next: nextArrowRef.current },
    ...gliderOptions,
  })
  return (
    <Container {...getContainerProps({ className })}>
      <Arrow {...getPrevArrowProps()} icon="chevron-left" ref={prevArrowRef} css={arrowCss} />
      <BackgroundGradient direction="prev" />
      <GliderContainer {...getGliderProps()} ref={ref}>
        <Track {...getTrackProps({ trackPadding })}>{children}</Track>
      </GliderContainer>
      <Arrow {...getNextArrowProps()} icon="chevron-right" ref={nextArrowRef} css={arrowCss} />
      <BackgroundGradient direction="next" />
    </Container>
  )
}
export default Carousel
