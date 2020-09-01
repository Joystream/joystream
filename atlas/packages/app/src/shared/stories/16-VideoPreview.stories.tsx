import React from 'react'
import { VideoPreview } from '../components'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { formatISO, parseISO, subWeeks } from 'date-fns'

export default {
  title: 'VideoPreview',
  component: VideoPreview,
  decorators: [withKnobs],
}

const initialDate = subWeeks(new Date(), 2)

export const Primary = () => {
  const createdAtISO = text('Created at ISO', formatISO(initialDate))

  return (
    <VideoPreview
      title={text('Video title', 'Test video')}
      channelName={text('Channel name', 'Test channel')}
      channelAvatarURL={text('Channel image URL', '')}
      showChannel={boolean('Show channel', true)}
      showMeta={boolean('Show meta', true)}
      createdAt={parseISO(createdAtISO)}
      duration={number('Video duration in seconds', 83)}
      progress={number('Watch progress percentage', 0, { range: true, min: 0, max: 100, step: 1 })}
      views={number('Views', 30)}
      posterURL={text('Poster image URL', 'https://source.unsplash.com/7MAjXGUmaPw/640x380')}
      onClick={boolean('Clickable', true) ? action('on click') : undefined}
      onChannelClick={boolean('Channel clickable', true) ? action('on channel click') : undefined}
    />
  )
}
