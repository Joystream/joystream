import React from 'react'

import styled from '@emotion/styled'

import { Gallery, MAX_VIDEO_PREVIEW_WIDTH, VideoPreviewBase } from '@/shared/components'
import VideoPreview from './VideoPreviewWithNavigation'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'

import { spacing } from '@/shared/theme'

type VideoGalleryProps = {
  title: string
  action?: string
  videos?: VideoFields[]
  loading?: boolean
}

const PLACEHOLDERS_COUNT = 12

const trackPadding = `${spacing.xs} 0 0 ${spacing.xs}`

const VideoGallery: React.FC<VideoGalleryProps> = ({ title, action, videos, loading }) => {
  const displayPlaceholders = loading || !videos

  return (
    <Gallery title={title} action={action} trackPadding={trackPadding}>
      {displayPlaceholders
        ? Array.from({ length: PLACEHOLDERS_COUNT }).map((_, idx) => (
            <StyledVideoPreviewBase key={`video-placeholder-${idx}`} />
          ))
        : videos!.map((video, idx) => (
            <StyledVideoPreview
              id={video.id}
              channelId={video.channel.id}
              title={video.title}
              channelName={video.channel.handle}
              channelAvatarURL={video.channel.avatarPhotoURL}
              views={video.views}
              createdAt={video.publishedOnJoystreamAt}
              duration={video.duration}
              posterURL={video.thumbnailURL}
              key={video.id}
            />
          ))}
    </Gallery>
  )
}

const StyledVideoPreviewBase = styled(VideoPreviewBase)`
  & + & {
    margin-left: 1.25rem;
  }

  width: ${MAX_VIDEO_PREVIEW_WIDTH};
`
const StyledVideoPreview = styled(VideoPreview)`
  & + & {
    margin-left: 1.25rem;
  }

  width: ${MAX_VIDEO_PREVIEW_WIDTH};
`

export default VideoGallery
