import { SerializedStyles } from '@emotion/core'
import React, { useRef } from 'react'

import { useGlider, GliderProps } from '../Glider'

import { Container, GliderContainer, Arrow, Track, BackgroundGradient } from './Carousel.style'

type CarouselProps = {
  paddingLeft?: number
  paddingTop?: number
  className?: string
  arrowCss?: SerializedStyles
} & GliderProps

const Carousel: React.FC<CarouselProps> = ({
  children,
  paddingLeft = 0,
  paddingTop = 0,
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
      <BackgroundGradient direction="prev" paddingLeft={paddingLeft} paddingTop={paddingTop} />
      <GliderContainer {...getGliderProps()} paddingLeft={paddingLeft} paddingTop={paddingTop} ref={ref}>
        <Track {...getTrackProps()}>{children}</Track>
      </GliderContainer>
      <Arrow {...getNextArrowProps()} icon="chevron-right" ref={nextArrowRef} css={arrowCss} />
      <BackgroundGradient direction="next" paddingLeft={paddingLeft} paddingTop={paddingTop} />
    </Container>
  )
}
export default Carousel
