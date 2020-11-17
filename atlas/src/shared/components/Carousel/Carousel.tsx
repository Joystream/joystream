import { SerializedStyles } from '@emotion/core'
import React, { useRef } from 'react'

import { useGlider, GliderProps } from '../Glider'

import { Container, GliderContainer, Arrow, Track, BackgroundGradient } from './Carousel.style'

type CarouselProps = {
  trackPadding?: string
  className?: string
  arrowCss?: SerializedStyles
} & GliderProps

const trackPaddingToMargin = (padding: string) =>
  padding
    .split(' ')
    .map((p) => {
      const isZero = parseFloat(p) === 0
      return !isZero ? `-${p}` : p
    })
    .join(' ')

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

  const margin = trackPaddingToMargin(trackPadding)
  return (
    <Container {...getContainerProps({ className })}>
      <Arrow {...getPrevArrowProps()} icon="chevron-left" ref={prevArrowRef} css={arrowCss} />
      <BackgroundGradient direction="prev" margin={margin} />
      <GliderContainer {...getGliderProps()} trackPadding={trackPadding} margin={margin} ref={ref}>
        <Track {...getTrackProps()}>{children}</Track>
      </GliderContainer>
      <Arrow {...getNextArrowProps()} icon="chevron-right" ref={nextArrowRef} css={arrowCss} />
      <BackgroundGradient direction="next" margin={margin} />
    </Container>
  )
}
export default Carousel
