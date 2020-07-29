import React from 'react'
import { VideoPlayer } from '../components'
import { boolean, number, text } from '@storybook/addon-knobs'

export default {
  title: 'VideoPlayer',
  component: VideoPlayer,
}

export const Default = () => {
  const src = text('Video source', 'https://js-video-example.s3.eu-central-1.amazonaws.com/waves.mp4')
  const autoplay = boolean('Autoplay', true)
  const fluid = boolean('Fluid mode', false)
  const fill = boolean('Fill mode', false)
  const width = number('Width (0 for none)', 800)
  const height = number('Height (0 for none)', 0)

  return (
    <VideoPlayer
      src={src}
      autoplay={autoplay}
      fluid={fluid}
      fill={fill}
      width={width || undefined}
      height={height || undefined}
    />
  )
}
