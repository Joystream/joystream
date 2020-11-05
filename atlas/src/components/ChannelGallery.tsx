import React from 'react'
import styled from '@emotion/styled'

import { ChannelPreviewBase, Gallery } from '@/shared/components'
import ChannelPreview from './ChannelPreviewWithNavigation'
import { spacing } from '@/shared/theme'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'

type ChannelGalleryProps = {
  title?: string
  action?: string
  channels?: ChannelFields[]
  loading?: boolean
}

const PLACEHOLDERS_COUNT = 12

const trackPadding = `${spacing.xs} 0 0 ${spacing.xs}`

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ title, action, channels, loading }) => {
  const displayPlaceholders = loading || !channels

  return (
    <Gallery title={title} action={action} trackPadding={trackPadding}>
      {displayPlaceholders
        ? Array.from({ length: PLACEHOLDERS_COUNT }).map((_, idx) => (
            <StyledChannelPreviewBase key={`channel-placeholder-${idx}`} />
          ))
        : channels!.map((channel) => (
            <StyledChannelPreview
              id={channel.id}
              name={channel.handle}
              avatarURL={channel.avatarPhotoURL}
              key={channel.id}
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
