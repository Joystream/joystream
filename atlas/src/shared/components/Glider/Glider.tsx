import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import Glider, { GliderEvent, GliderEventMap, Options } from 'glider-js'
import 'glider-js/glider.min.css'

type GliderEventListeners = {
  onAdd?: (event: GliderEvent<GliderEventMap['glider-add']>) => void
  onAnimated?: (event: GliderEvent<GliderEventMap['glider-animated']>) => void
  onDestroy?: (event: GliderEvent<GliderEventMap['glider-destroy']>) => void
  onLoaded?: (event: GliderEvent<GliderEventMap['glider-loaded']>) => void
  onRefresh?: (event: GliderEvent<GliderEventMap['glider-refresh']>) => void
  onRemove?: (event: GliderEvent<GliderEventMap['glider-remove']>) => void
  onSlideHidden?: (event: GliderEvent<GliderEventMap['glider-slide-hidden']>) => void
  onSlideVisible?: (event: GliderEvent<GliderEventMap['glider-slide-visible']>) => void
}

export type GliderProps = Options & GliderEventListeners

type PropsWithClassName<T> = {
  className?: string
} & T
function getPropsFor(name: string) {
  return function <T>({ className, ...otherProps }: PropsWithClassName<T> = {} as PropsWithClassName<T>) {
    return { className: `${className ? `${className} ` : ''}${name}`, ...otherProps }
  }
}
const getGliderProps = getPropsFor('glider')
const getTrackProps = getPropsFor('glider-track')
const getNextArrowProps = getPropsFor('glider-next')
const getPrevArrowProps = getPropsFor('glider-prev')
const getContainerProps = getPropsFor('glider-contain')

export function useGlider<T extends HTMLElement>({
  onAdd,
  onAnimated,
  onDestroy,
  onLoaded,
  onRefresh,
  onRemove,
  onSlideHidden,
  onSlideVisible,
  ...gliderOptions
}: GliderProps) {
  const [glider, setGlider] = useState<Glider.Static<HTMLElement>>()
  const element = useRef<T>(null)

  useLayoutEffect(() => {
    if (!element.current) {
      return
    }
    const newGlider = new Glider(element.current, { skipTrack: true })
    setGlider(newGlider)

    return () => {
      if (newGlider) {
        newGlider.destroy()
      }
    }
  }, [])
  useLayoutEffect(() => {
    if (!glider) {
      return
    }
    glider.setOption({ skipTrack: true, ...gliderOptions }, true)
    glider.refresh(true)
  }, [gliderOptions, glider])

  useEventListener(element.current, 'glider-add', onAdd)
  useEventListener(element.current, 'glider-animated', onAnimated)
  useEventListener(element.current, 'glider-destroy', onDestroy)
  useEventListener(element.current, 'glider-loaded', onLoaded)
  useEventListener(element.current, 'glider-refresh', onRefresh)
  useEventListener(element.current, 'glider-remove', onRemove)
  useEventListener(element.current, 'glider-slide-hidden', onSlideHidden)
  useEventListener(element.current, 'glider-slide-visible', onSlideVisible)
  return {
    ref: element,
    glider,
    getGliderProps,
    getTrackProps,
    getNextArrowProps,
    getPrevArrowProps,
    getContainerProps,
  }
}

function useEventListener<K extends keyof GliderEventMap>(
  element: HTMLElement | undefined | null,
  event: K,
  listener: (event: GliderEvent<GliderEventMap[K]>) => void = () => {}
) {
  const savedListener = useRef(listener)

  useEffect(() => {
    savedListener.current = listener
  }, [listener])

  useLayoutEffect(() => {
    if (!element) {
      return
    }
    element.addEventListener(event, savedListener.current)
    return () => {
      element.removeEventListener(event, savedListener.current)
    }
  }, [event, element])
}

declare global {
  interface HTMLElement {
    addEventListener<K extends keyof GliderEventMap>(
      type: K,
      listener: (event: GliderEvent<GliderEventMap[K]>) => void,
      options?: boolean | AddEventListenerOptions
    ): void
    removeEventListener<K extends keyof GliderEventMap>(
      type: K,
      listener: (event: GliderEvent<GliderEventMap[K]>) => void
    ): void
  }
}
