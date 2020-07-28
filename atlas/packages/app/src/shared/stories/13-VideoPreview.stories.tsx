import React from 'react'
import { VideoPreview } from '../components'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

export default {
  title: 'VideoPreview',
  component: VideoPreview,
  decorators: [withKnobs],
}

export const Primary = () => (
  <VideoPreview
    title={text('Video title', 'Test video')}
    channel={text('Channel name', 'Test channel')}
    channelImg={text('Channel image', '')}
    showChannel={boolean('Show channel', true)}
    showMeta={boolean('Show meta', true)}
    createdAt={text('Formatted time', '2 weeks ago')}
    duration={text('Video duration', '1:23')}
    progress={number('Watch progress percentage', 0, { range: true, min: 0, max: 100, step: 1 })}
    views={text('Views', '30')}
    poster={text('Poster image', 'https://cdn.pixabay.com/photo/2020/01/31/07/26/japan-4807317_1280.jpg')}
    onClick={boolean('Clickable', true) ? action('on click') : undefined}
    onChannelClick={boolean('Channel clickable', true) ? action('on channel click') : undefined}
  />
)
