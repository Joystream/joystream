import React from 'react'
import { BreakPoint } from 'react-glider'

import styled from '@emotion/styled'

import { breakpointsOfGrid, Gallery, MIN_VIDEO_PREVIEW_WIDTH, VideoPreviewBase } from '@/shared/components'
import VideoPreview from './VideoPreviewWithNavigation'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'

import { sizes, spacing } from '@/shared/theme'
import { css } from '@emotion/core'

type VideoGalleryProps = {
  title?: string
  videos?: VideoFields[]
  loading?: boolean
  error?: Error
}

const PLACEHOLDERS_COUNT = 12

const trackPadding = `${spacing.xs} 0 0 0`

// This is needed since Gliderjs and the Grid have different resizing policies
const breakpoints = breakpointsOfGrid({
  breakpoints: 6,
  minItemWidth: 300,
  gridColumnGap: 24,
  viewportContainerDifference: 64,
}).map((breakpoint, idx) => ({
  breakpoint,
  settings: {
    slidesToShow: idx + 1,
  },
})) as BreakPoint[]

const VideoGallery: React.FC<VideoGalleryProps> = ({ title, videos, loading }) => {
  const displayPlaceholders = loading || !videos

  return (
    <Gallery title={title} trackPadding={trackPadding} responsive={breakpoints} itemWidth={MIN_VIDEO_PREVIEW_WIDTH}>
      {displayPlaceholders
        ? Array.from({ length: PLACEHOLDERS_COUNT }).map((_, idx) => (
            <StyledVideoPreviewBase key={`video-placeholder-${idx}`} />
          ))
        : videos!.map((video) => (
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

const videoPreviewCss = css`
  & + & {
    margin-left: ${sizes.b6}px;
  }

  min-width: ${MIN_VIDEO_PREVIEW_WIDTH};
`

const StyledVideoPreviewBase = styled(VideoPreviewBase)`
  ${videoPreviewCss};
`
const StyledVideoPreview = styled(VideoPreview)`
  ${videoPreviewCss};
`

export default VideoGallery
