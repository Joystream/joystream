import React, { useState, useCallback, useMemo } from 'react'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import { breakpointsOfGrid, Gallery, MIN_VIDEO_PREVIEW_WIDTH, VideoPreviewBase } from '@/shared/components'
import VideoPreview from './VideoPreviewWithNavigation'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { sizes } from '@/shared/theme'

type VideoGalleryProps = {
  title?: string
  videos?: VideoFields[]
  loading?: boolean
}

const PLACEHOLDERS_COUNT = 12
const CAROUSEL_ARROW_HEIGHT = 48
const trackPadding = `${sizes.b2}px 0 0 0`

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
}))

const VideoGallery: React.FC<VideoGalleryProps> = ({ title, videos, loading }) => {
  const [imgHeight, setImgHeight] = useState<number>()
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    setImgHeight(img?.clientHeight)
  }, [])

  const arrowPosition = useMemo(() => {
    if (!imgHeight) {
      return
    }
    const topPx = (imgHeight - CAROUSEL_ARROW_HEIGHT) / 2 + sizes.b2
    return css`
      top: ${topPx}px;
    `
  }, [imgHeight])

  const displayPlaceholders = loading || !videos

  return (
    <Gallery
      title={title}
      trackPadding={trackPadding}
      responsive={breakpoints}
      itemWidth={MIN_VIDEO_PREVIEW_WIDTH}
      arrowCss={arrowPosition}
    >
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
              channelAvatarURL={video.channel.avatarPhotoUrl}
              views={video.views}
              createdAt={video.createdAt}
              duration={video.duration}
              posterURL={video.thumbnailUrl}
              key={video.id}
              imgRef={idx === 0 ? imgRef : undefined}
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
