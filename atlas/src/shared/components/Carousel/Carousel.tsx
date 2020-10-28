import React, { useState, useEffect, useRef } from 'react'
import { GliderProps, BreakPoint, GliderMethods } from 'react-glider'

import { Container, StyledGlider, Arrow } from './Carousel.style'

import 'glider-js/glider.min.css'

type CarouselProps = {
  trackPadding?: string
} & GliderProps

type TrackProps = {
  className?: string
  padding?: string
}
const Track: React.FC<TrackProps> = ({ className = '', ...props }) => (
  <div className={`glider-track ${className}`} {...props} />
)

const RightArrow = <Arrow name="chevron-right" />
const LeftArrow = <Arrow name="chevron-left" />

const Carousel: React.FC<CarouselProps> = ({ children, trackPadding = '0', className, ...gliderProps }) => {
  // Using any because the GliderMethods type only has methods and I need the full instance
  const gliderRef = React.useRef<any>()
  const [arrows, setArrows] = React.useState<
    { prev: string | HTMLButtonElement; next: string | HTMLButtonElement } | undefined
  >(undefined)

  React.useLayoutEffect(() => {
    if (gliderRef.current) {
      const glider = gliderRef.current.ele
      const prevArrow = glider.previousSibling
      const nextArrow = glider.nextSibling
      const INSTANCE_KEY = Math.round(Math.random() * 1000)
      prevArrow.classList.add(`glider-${INSTANCE_KEY}-prev`)
      nextArrow.classList.add(`glider-${INSTANCE_KEY}-next`)
      setArrows({ prev: prevArrow, next: nextArrow })
    }
  }, [])

  // This is needed because react-glider will render arrows only if the arrows option is undefined, so arrows won't display if you pass an object to StyledGlider
  React.useLayoutEffect(() => {
    if (gliderRef.current && arrows) {
      const { prev: prevArrow, next: nextArrow } = arrows
      const container = gliderRef.current.ele.parentElement
      container.insertBefore(prevArrow, gliderRef.current.ele)
      container.appendChild(nextArrow)
    }
  }, [arrows])

  return (
    <Container trackPadding={trackPadding} className={className}>
      <StyledGlider
        addTrack
        skipTrack
        hasArrows
        draggable
        ref={gliderRef}
        iconLeft={LeftArrow}
        iconRight={RightArrow}
        arrows={arrows as { prev: string; next: string }}
        {...gliderProps}
      >
        <Track padding={trackPadding}>{children}</Track>
      </StyledGlider>
    </Container>
  )
}
export default Carousel
