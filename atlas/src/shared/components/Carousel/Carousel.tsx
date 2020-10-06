import React, { useState } from 'react'
import { SerializedStyles } from '@emotion/core'
import { animated, useSpring } from 'react-spring'
import useResizeObserver from 'use-resize-observer'
import { CarouselStyleProps, useCSS } from './Carousel.style'
import NavButton from '../NavButton'

export type CarouselProps = {
  containerCss?: SerializedStyles
  leftControlCss?: SerializedStyles
  rightControlCss?: SerializedStyles
  disableControls?: boolean
  onScroll?: (direction: 'left' | 'right') => void
} & CarouselStyleProps

const Carousel: React.FC<CarouselProps> = ({
  children,
  containerCss,
  leftControlCss,
  rightControlCss,
  disableControls = false,
  onScroll = () => {},
}) => {
  const [scroll, setScroll] = useSpring(() => ({
    transform: `translateX(0px)`,
  }))
  const [carouselOffset, setCarouselOffset] = useState(0)
  const { width: containerWidth = 0, ref: containerRef } = useResizeObserver<HTMLDivElement>()
  const { width: childrenWidth = 0, ref: childrenContainerRef } = useResizeObserver<HTMLDivElement>()

  const styles = useCSS({})

  const maxScrollOffset = childrenWidth - containerWidth

  const showLeftControl = !disableControls && carouselOffset > 0
  const showRightControl = !disableControls && carouselOffset < maxScrollOffset

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerWidth == null) {
      return
    }
    let scrollAmount
    switch (direction) {
      case 'left': {
        // Prevent overscroll on the left
        const newOffset = carouselOffset - containerWidth
        scrollAmount = newOffset < 0 ? 0 : newOffset
        onScroll('left')
        break
      }
      case 'right': {
        // Prevent overscroll on the right
        const newOffset = carouselOffset + containerWidth
        scrollAmount = newOffset > maxScrollOffset ? maxScrollOffset : newOffset
        onScroll('right')
        break
      }
    }
    setCarouselOffset(scrollAmount)
    setScroll({
      transform: `translateX(-${scrollAmount}px)`,
    })
  }

  if (!Array.isArray(children)) {
    return <>{children}</>
  }

  return (
    <div css={[styles.container, containerCss]}>
      <div css={styles.outerItemsContainer} ref={containerRef}>
        <animated.div css={styles.innerItemsContainer} style={scroll}>
          <div css={styles.innerItemsContainer} ref={childrenContainerRef}>
            {children.map((element, idx) => (
              <React.Fragment key={`Carousel-${idx}`}>{element}</React.Fragment>
            ))}
          </div>
        </animated.div>
      </div>
      {showLeftControl && (
        <NavButton outerCss={[styles.navLeft, leftControlCss]} direction="left" onClick={() => handleScroll('left')} />
      )}
      {showRightControl && (
        <NavButton
          outerCss={[styles.navRight, rightControlCss]}
          direction="right"
          onClick={() => handleScroll('right')}
        />
      )}
    </div>
  )
}

export default Carousel
