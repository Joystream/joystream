import React from 'react'
import { SerializedStyles } from '@emotion/core'
import { useCSS } from './Gallery.style'
import Button from '../Button'
import Carousel, { CarouselProps } from '../Carousel'

type GalleryProps = {
  title?: string
  action?: string
  onClick?: () => void
  containerCss?: SerializedStyles
} & CarouselProps

const Gallery: React.FC<GalleryProps> = ({ title, action = '', containerCss, onClick, ...props }) => {
  const styles = useCSS()
  return (
    <section css={[styles.container, containerCss]}>
      <div css={styles.headingContainer}>
        {title && <h4>{title}</h4>}
        {action && (
          <Button type="tertiary" onClick={onClick}>
            {action}
          </Button>
        )}
      </div>
      <Carousel {...props} />
    </section>
  )
}

export default Gallery
