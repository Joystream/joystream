import React from 'react'
import { css } from '@emotion/core'
import { ChannelPreview, Gallery } from '@/shared/components'
import { mockChannels } from '@/config/mocks'

type ChannelGalleryProps = {
  title: string
  action?: string
}

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ title, action }) => (
  <Gallery title={title} action={action}>
    {mockChannels.map((channel) => (
      <ChannelPreview
        name={channel.name}
        avatarURL={channel.avatarURL}
        views={channel.views}
        key={channel.id}
        outerContainerCss={css`
          margin-right: 1.5rem;
        `}
      />
    ))}
  </Gallery>
)

export default ChannelGallery
