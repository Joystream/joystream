import React from 'react'
import { Container, HeadingContainer } from './Gallery.style'
import Carousel from '../Carousel'

type GalleryProps = {
  title?: string
  className?: string
} & React.ComponentProps<typeof Carousel>

const Gallery: React.FC<GalleryProps> = ({ title, className, ...carouselProps }) => {
  return (
    <Container className={className}>
      {title && (
        <HeadingContainer>
          <h4>{title}</h4>
        </HeadingContainer>
      )}
      <Carousel {...carouselProps} />
    </Container>
  )
}

export default Gallery
