import React from 'react'
import { css } from '@emotion/core'
import { ChannelPreview, Gallery } from '@/shared/components'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'

type ChannelGalleryProps = {
  title: string
  action?: string
  channels?: ChannelFields[]
  loading?: boolean
}

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ title, action, channels, loading }) => {
  if (loading || !channels) {
    return <p>Loading</p>
  }

  return (
    <Gallery title={title} action={action}>
      {channels.map((channel) => (
        <ChannelPreview
          name={channel.handle}
          avatarURL={channel.avatarPhotoURL}
          views={channel.totalViews}
          key={channel.id}
          outerContainerCss={css`
            margin-right: 1.5rem;
          `}
        />
      ))}
    </Gallery>
  )
}

export default ChannelGallery
