import React from 'react'
import styled from '@emotion/styled'
import Glider, { GliderProps, BreakPoint } from 'react-glider'
import 'glider-js/glider.min.css'

import Icon from '../Icon'

export type CarouselProps = {
  trackPadding?: string
} & GliderProps

const Track: React.FC<any> = ({ className = '', ...props }) => (
  <div className={`glider-track ${className}`} {...props} />
)

const defaultBreakpoints: BreakPoint[] = [
  {
    breakpoint: 400,
    settings: {
      slidesToShow: 1,
      slidesToScroll: 1,
      duration: 0.25,
    },
  },
  {
    breakpoint: 775,
    settings: {
      slidesToShow: 4,
      slidesToScroll: 'auto',
      duration: 0.25,
    },
  },
] as BreakPoint[]

const StyledTrack = styled(Track)<{ padding: string }>`
  padding: ${(props) => props.padding};
`
const LeftIcon = <Icon name="chevron-left" />
const RightIcon = <Icon name="chevron-right" />
const Carousel: React.FC<CarouselProps> = ({
  children,
  trackPadding = '0',
  responsive = defaultBreakpoints,
  ...gliderProps
}) => {
  return (
    <Glider skipTrack hasArrows iconLeft={LeftIcon} iconRight={RightIcon} responsive={responsive} {...gliderProps}>
      <StyledTrack padding={trackPadding}>{children}</StyledTrack>
    </Glider>
  )
}
export default Carousel
