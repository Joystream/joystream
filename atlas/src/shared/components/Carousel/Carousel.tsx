import React, { useEffect, useRef, useLayoutEffect } from 'react'

import { Container, GliderContainer, Arrow, Track, FADE_COLOR } from './Carousel.style'

import Glider, { Options, GliderEventMap, GliderEvent } from 'glider-js'
import 'glider-js/glider.min.css'

type GliderEventHandlers = {
  onAdd?: (event: GliderEvent<GliderEventMap['glider-add']>) => void
  onAnimated?: (event: GliderEvent<GliderEventMap['glider-animated']>) => void
  onDestroy?: (args: GliderEvent<GliderEventMap['glider-destroy']>) => void
  onLoaded?: (args: GliderEvent<GliderEventMap['glider-loaded']>) => void
  onRefresh?: (args: GliderEvent<GliderEventMap['glider-refresh']>) => void
  onRemove?: (args: GliderEvent<GliderEventMap['glider-remove']>) => void
  onSlideHidden?: (args: GliderEvent<GliderEventMap['glider-slide-hidden']>) => void
  onSlideVisible?: (args: GliderEvent<GliderEventMap['glider-slide-visible']>) => void
}

type CarouselProps = {
  trackPadding?: string
  className?: string
} & Options &
  GliderEventHandlers

const Carousel: React.FC<CarouselProps> = ({
  children,
  trackPadding = '0',
  className = '',
  slidesToShow = 'auto',
  onSlideHidden = () => {},
  onSlideVisible = () => {},
  onAdd = () => {},
  onAnimated = () => {},
  onDestroy = () => {},
  onRefresh = () => {},
  onLoaded = () => {},
  onRemove = () => {},
  ...gliderOptions
}) => {
  const nextArrowRef = useRef<HTMLButtonElement>(null)
  const prevArrowRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gliderRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Glider.Static<HTMLDivElement>>()

  useLayoutEffect(() => {
    if (gliderRef.current) {
      //  @ts-ignore there are no typings for gliderjs
      const gliderInstance = new Glider(gliderRef.current, {
        skipTrack: true,
        arrows: {
          prev: prevArrowRef.current,
          next: nextArrowRef.current,
        },
      })
      instanceRef.current = gliderInstance
    }
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy()
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setOption(
        {
          slidesToShow,
          ...gliderOptions,
          skipTrack: true,
          arrows: {
            prev: prevArrowRef.current,
            next: nextArrowRef.current,
          },
        },
        true
      )
      instanceRef.current.refresh(true)
    }
  }, [gliderOptions, slidesToShow])

  useEffect(() => {
    const element = gliderRef.current as Element | null

    const setContainerCSS = () => {
      const isNextArrowDisabled = nextArrowRef.current?.classList.contains('disabled')
      const isPrevArrowDisabled = prevArrowRef.current?.classList.contains('disabled')
      if (containerRef.current) {
        containerRef.current.style.setProperty('--next-arrow-color', isNextArrowDisabled ? 'transparent' : FADE_COLOR)
        containerRef.current.style.setProperty('--prev-arrow-color', isPrevArrowDisabled ? 'transparent' : FADE_COLOR)
      }
    }
    const handleSlideVisible = (event: GliderEvent<GliderEventMap['glider-slide-visible']>) => {
      if (onSlideVisible) {
        onSlideVisible(event)
      }
      setContainerCSS()
    }

    const handleSlideHidden = (event: GliderEvent<GliderEventMap['glider-slide-hidden']>) => {
      if (onSlideHidden) {
        onSlideHidden(event)
      }
      setContainerCSS()
    }
    if (element) {
      element.addEventListener('glider-add', onAdd)
      element.addEventListener('glider-animated', onAnimated)
      element.addEventListener('glider-destroy', onDestroy)
      element.addEventListener('glider-loaded', onLoaded)
      element.addEventListener('glider-refresh', onRefresh)
      element.addEventListener('glider-remove', onRemove)
      element.addEventListener('glider-slide-hidden', handleSlideHidden)
      element.addEventListener('glider-slide-visible', handleSlideVisible)
    }

    return () => {
      if (element) {
        element.removeEventListener('glider-add', onAdd)
        element.removeEventListener('glider-animated', onAnimated)
        element.removeEventListener('glider-destroy', onDestroy)
        element.removeEventListener('glider-loaded', onLoaded)
        element.removeEventListener('glider-refresh', onRefresh)
        element.removeEventListener('glider-remove', onRemove)
        element.removeEventListener('glider-slide-hidden', onSlideHidden)
        element.removeEventListener('glider-slide-visible', onSlideVisible)
      }
    }
  }, [onAdd, onAnimated, onDestroy, onLoaded, onRefresh, onRemove, onSlideHidden, onSlideVisible])

  return (
    <Container className={`glider-contain ${className}`} ref={containerRef}>
      <Arrow className="glider-prev" icon="chevron-left" ref={prevArrowRef} />
      <GliderContainer className="glider" ref={gliderRef}>
        <Track className="glider-track" trackPadding={trackPadding}>
          {children}
        </Track>
      </GliderContainer>
      <Arrow className="glider-next" icon="chevron-right" ref={nextArrowRef} />
    </Container>
  )
}
export default Carousel

declare global {
  interface Element {
    addEventListener<K extends keyof Glider.GliderEventMap>(
      type: K,
      listener: (event: Glider.GliderEvent<Glider.GliderEventMap[K]>) => void,
      options?: boolean | AddEventListenerOptions
    ): void
    removeEventListener<K extends keyof Glider.GliderEventMap>(
      type: K,
      listener: (event: Glider.GliderEvent<Glider.GliderEventMap[K]>) => void,
      options?: boolean | EventListenerOptions
    ): void
  }
}
