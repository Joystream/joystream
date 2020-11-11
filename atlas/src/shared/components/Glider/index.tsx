import * as React from 'react'

// tslint:disable-next-line
import 'glider-js'

export interface BreakPoint {
  breakpoint: number
  settings: {
    slidesToShow: number | 'auto'
    slidesToScroll: number | 'auto'
    itemWidth?: number
    duration?: number
  }
}

export type GliderProps = {
  children: React.ReactNode
  hasArrows?: boolean
  hasDots?: boolean
  className?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  scrollToSlide?: number
  scrollToPage?: number
  addTrack?: boolean

  /**
   * The number of slides to show in container
   * If this value is set to auto, it will be
   * automatically calculated based upon the number
   * of items able to fit within the container viewport.
   * This requires setting the itemWidth option.
   *
   * @default 1
   */
  slidesToShow?: number | 'auto'
  /**
   * The number of slides to scroll when arrow navigation
   * is used. If this value is set to auto, it will match
   * the value of slidesToScroll.
   *
   * @default 1
   */
  slidesToScroll?: number | 'auto'
  /** This value is ignored unless slidesToShow is set to auto, in which it is then required. */
  itemWidth?: number
  /**
   * This prevents resizing items to fit when slidesToShow is set to auto.
   * NOTE: This will yield fractional slides if your container is not sized appropriately
   */
  exactWidth?: number
  /**
   * If true, Glider.js will lock to the nearest slide on resizing of the window
   */
  resizeLock?: number
  /**
   * If true, Glider.js will scroll to the beginning/end when its respective endpoint is reached
   */
  rewind?: number
  /**
   * An aggravator used to control animation speed. Higher is slower!
   *
   * @default 0.5
   */
  duration?: number
  /** An string containing the dot container selector */
  dots?: string
  /** An object containing the prev/next arrows selectors */
  arrows?: {
    prev: string
    next: string
  }

  /**
   * If true, the list can be scrolled by click and dragging with the mouse
   *
   * @default false
   */
  draggable?: boolean
  /**
   * How much to aggravate the velocity of the mouse dragging
   *
   * @default 3.3
   */
  dragVelocity?: number

  /**
   * Whether or not to release the scroll events from the container
   *
   *  @default false
   */
  scrollPropagate?: boolean
  /**
   * Whether or not Glider.js events should bubble (useful for binding events to all carousels)
   *
   * @default true
   */
  propagateEvent?: boolean

  /**
   * If true, Glider.js will scroll to the nearest slide after any scroll interactions.
   *
   * @default false
   */
  scrollLock?: boolean

  /**
   * Whether or not Glider.js should skip wrapping its children with a 'glider-track' <div>.
   * NOTE: If true, Glider.js will assume that the 'glider-track' element has been added manually. All slides must be children of the track element.
   *
   * @default false
   */
  skipTrack?: boolean
  /**
   * how long to wait after scroll event before locking,
   * if too low, it might interrupt normal scrolling
   *
   * @default 250
   */
  scrollLockDelay?: number

  /**
   * An object containing custom settings per provided breakpoint.
   * Glider.js breakpoints are mobile-first
   * be conscious of your ordering,
   */
  responsive?: BreakPoint[]

  /** use any custom easing function, compatible with most easing plugins */
  easing?(x: number, t: number, b: number, c: number, d: number): number

  /** Called after Glider.js is first initialized */
  onLoad?(context: any, event: Event): void
  /** Called whenever a Glider.js paging animation is complete */
  onAnimated?(context: any, event: Event): void
  /** Called whenever a Glider.js animation is complete */
  onRemove?(context: any, event: Event): void
  /** Called whenever a slide a shown. Passed an object containing the slide index */
  onSlideVisible?(context: any, event: Event): void
  /** Called whenever Glider.js refreshes it's elements or settings */
  onRefresh?(context: any, event: Event): void
  /** Called whenever an item is added to Glider.js */
  onAdd?(context: any, event: Event): void
  /** Called whenever a Glider.js is destroyed */
  onDestroy?(context: any, event: Event): void
  /** Called whenever a slide a hidden. Passed an object containing the slide index */
  onSlideHidden?(context: any, event: Event): void
}

type GliderOptions = Pick<
  GliderProps,
  | 'arrows'
  | 'dots'
  | 'slidesToShow'
  | 'slidesToScroll'
  | 'itemWidth'
  | 'exactWidth'
  | 'scrollLock'
  | 'scrollLockDelay'
  | 'resizeLock'
  | 'responsive'
  | 'rewind'
  | 'scrollPropagate'
  | 'draggable'
  | 'dragVelocity'
  | 'duration'
  | 'skipTrack'
>

export type GliderMethods = {
  destroy(): void
  updateControls(): void
  refresh(rebuildPaging?: boolean): void
  setOption(options: GliderOptions, global?: boolean): void
  scrollTo(pixelOffset: number): void
  scrollItem(slideIndex: number, isActuallyDotIndex?: boolean): void
}

const makeGliderOptions = (props: GliderProps) => ({
  ...props,
  arrows:
    (props.hasArrows && {
      next: props?.arrows?.next ?? '.glider-next',
      prev: props?.arrows?.prev ?? '.glider-prev',
    }) ||
    undefined,
  dots: (props.hasDots && props.dots) || '#dots' || undefined,
})
const GliderComponent = React.forwardRef((props: GliderProps, ref: React.Ref<GliderMethods>) => {
  const innerRef = React.useRef<HTMLDivElement>(null)
  const gliderRef = React.useRef<GliderMethods>()
  const isMountedRef = React.useRef<boolean>(false)

  // On mount initialize the glider and hook up events
  React.useLayoutEffect(() => {
    if (!innerRef.current) {
      return
    }

    // @ts-ignore Glider is not typed
    const glider = new Glider(innerRef.current, makeGliderOptions(props)) as GliderMethods
    gliderRef.current = glider

    const addEventListener = (event: string, fn: any) => {
      if (typeof fn === 'function' && innerRef.current) {
        innerRef.current.addEventListener(event, fn)
      }
    }

    addEventListener('glider-slide-visible', props.onSlideVisible)
    addEventListener('glider-loaded', props.onLoad)
    addEventListener('glider-animated', props.onAnimated)
    addEventListener('glider-remove', props.onRemove)
    addEventListener('glider-refresh', props.onRefresh)
    addEventListener('glider-add', props.onAdd)
    addEventListener('glider-destroy', props.onDestroy)
    addEventListener('glider-slide-hidden', props.onSlideHidden)

    if (props.scrollToSlide) {
      glider.scrollItem(props.scrollToSlide - 1)
    } else if (props.scrollToPage) {
      glider.scrollItem(props.scrollToPage - 1, true)
    }
  }, [])

  React.useEffect(() => {
    isMountedRef.current = true

    return () => {
      const removeEventListener = (event: string, fn: any) => {
        if (typeof fn === 'function' && innerRef.current) {
          innerRef.current.removeEventListener(event, fn)
        }
      }

      removeEventListener('glider-slide-visible', props.onSlideVisible)
      removeEventListener('glider-loaded', props.onLoad)
      removeEventListener('glider-animated', props.onAnimated)
      removeEventListener('glider-remove', props.onRemove)
      removeEventListener('glider-refresh', props.onRefresh)
      removeEventListener('glider-add', props.onAdd)
      removeEventListener('glider-destroy', props.onDestroy)
      removeEventListener('glider-slide-hidden', props.onSlideHidden)

      if (gliderRef.current) {
        gliderRef.current.destroy()
      }
    }
  }, [
    props.onAdd,
    props.onAnimated,
    props.onDestroy,
    props.onLoad,
    props.onRefresh,
    props.onRemove,
    props.onSlideHidden,
    props.onSlideVisible,
  ])
  // When the props update, update the glider
  React.useEffect(() => {
    if (!(gliderRef.current && isMountedRef.current)) {
      return
    }

    gliderRef.current.setOption(makeGliderOptions(props), true)
    gliderRef.current.refresh(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props])

  // Expose the glider instance to the user so they can call the methods too
  React.useImperativeHandle(ref, () => gliderRef.current as GliderMethods)

  return (
    <div className="glider-contain">
      {props.hasArrows && !props.arrows && (
        <button role="button" className="glider-prev" id="glider-prev">
          {props.iconLeft || '«'}
        </button>
      )}

      <div className={props.className} ref={innerRef}>
        {props.children}
      </div>

      {props.hasDots && !props.dots && <div id="dots" />}

      {props.hasArrows && !props.arrows && (
        <button role="button" className="glider-next" id="glider-next">
          {props.iconRight || '»'}
        </button>
      )}
    </div>
  )
})

GliderComponent.displayName = 'Glider'

export default GliderComponent
