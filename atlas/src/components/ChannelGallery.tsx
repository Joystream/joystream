import React from 'react'
import styled from '@emotion/styled'

import { ChannelPreviewBase, Gallery } from '@/shared/components'
import ChannelPreview from './ChannelPreviewWithNavigation'
import { spacing } from '@/shared/theme'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'

type ChannelGalleryProps = {
  title?: string
  channels?: ChannelFields[]
  loading?: boolean
}

const PLACEHOLDERS_COUNT = 12

const trackPadding = `${spacing.xs} 0 0 ${spacing.xs}`

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ title, channels, loading }) => {
  const displayPlaceholders = loading || !channels

  return (
    <Gallery title={title} trackPadding={trackPadding} itemWidth={220} exactWidth={true}>
      {displayPlaceholders
        ? Array.from({ length: PLACEHOLDERS_COUNT }).map((_, idx) => (
            <ChannelPreviewBase key={`channel-placeholder-${idx}`} />
          ))
        : channels!.map((channel) => (
            <StyledChannelPreview
              id={channel.id}
              name={channel.handle}
              avatarURL={channel.avatarPhotoUrl}
              key={channel.id}
              animated
            />
          ))}
    </Gallery>
  )
}

const StyledChannelPreview = styled(ChannelPreview)`
  + * {
    margin-left: 16px;
  }
`

export default ChannelGallery
