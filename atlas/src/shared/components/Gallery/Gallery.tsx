import React from 'react'
import { Container, HeadingContainer } from './Gallery.style'
import Button from '../Button'
import Carousel from '../Carousel'

type GalleryProps = {
  title?: string
  action?: string
  onClick?: () => void
  className?: string
} & React.ComponentProps<typeof Carousel>

const Gallery: React.FC<GalleryProps> = ({ title, action = '', className, onClick, ...carouselProps }) => {
  return (
    <Container className={className}>
      <HeadingContainer>
        {title && <h4>{title}</h4>}
        {action && (
          <Button variant="tertiary" onClick={onClick}>
            {action}
          </Button>
        )}
      </HeadingContainer>
      <Carousel {...carouselProps} />
    </Container>
  )
}

export default Gallery
