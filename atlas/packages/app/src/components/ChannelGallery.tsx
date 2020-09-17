import React from 'react'
import styled from '@emotion/styled'
import { navigate } from '@reach/router'

import { ChannelPreview, ChannelPreviewBase, Gallery } from '@/shared/components'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'
import routes from '@/config/routes'

type ChannelGalleryProps = {
  title: string
  action?: string
  channels?: ChannelFields[]
  loading?: boolean
}

const PLACEHOLDERS_COUNT = 12

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ title, action, channels, loading }) => {
  const displayPlaceholders = loading || !channels

  return (
    <Gallery title={title} action={action} disableControls={displayPlaceholders}>
      {displayPlaceholders
        ? Array.from({ length: PLACEHOLDERS_COUNT }).map((_, idx) => (
            <StyledChannelPreviewBase key={`channel-placeholder-${idx}`} />
          ))
        : channels!.map((channel) => (
            <StyledChannelPreview
              name={channel.handle}
              avatarURL={channel.avatarPhotoURL}
              views={channel.totalViews}
              key={channel.id}
              onClick={() => navigate(routes.channel(channel.id))}
              animated
            />
          ))}
    </Gallery>
  )
}

const StyledChannelPreviewBase = styled(ChannelPreviewBase)`
  margin-right: 1.5rem;
`

const StyledChannelPreview = styled(ChannelPreview)`
  margin-right: 1.5rem;
`

export default ChannelGallery
