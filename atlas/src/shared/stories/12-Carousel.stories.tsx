import React from 'react'
import { Carousel } from '../components'

export default {
  title: 'Carousel',
  component: Carousel,
}

const CarouselItem = ({ children }) => (
  <div style={{ width: '300px', height: '100px', textAlign: 'center' }}>{children}</div>
)

export const Default = () => (
  <Carousel>
    <CarouselItem>CarouselItem 1</CarouselItem>
    <CarouselItem>CarouselItem 2</CarouselItem>
    <CarouselItem>CarouselItem 3</CarouselItem>
    <CarouselItem>CarouselItem 4</CarouselItem>
    <CarouselItem>CarouselItem 5</CarouselItem>
    <CarouselItem>CarouselItem 6</CarouselItem>
  </Carousel>
)

export const Draggable = () => (
  <Carousel draggable>
    {Array.from({ length: 10 }, (_, i) => (
      <CarouselItem> Carousel Item {i}</CarouselItem>
    ))}
  </Carousel>
)
