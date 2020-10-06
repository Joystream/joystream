import React from 'react'
import { ChannelPreview, ChannelPreviewBase } from '../components'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

export default {
  title: 'ChannelPreview',
  component: ChannelPreview,
  decorators: [withKnobs],
}

export const Primary = () => {
  return (
    <ChannelPreview
      name={text('Channel name', 'Test channel')}
      views={number('Channel views', 123456)}
      avatarURL={text('Channel avatar URL', 'https://source.unsplash.com/collection/781477/320x320')}
      animated={boolean('animated', false)}
    />
  )
}

export const Placeholder = () => {
  return <ChannelPreviewBase />
}
