import React, { useCallback, useMemo, useState } from 'react'
import { css, SerializedStyles } from '@emotion/core'
import styled from '@emotion/styled'

import { Gallery, MAX_VIDEO_PREVIEW_WIDTH, VideoPreviewBase } from '@/shared/components'
import VideoPreview from './VideoPreviewWithNavigation'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { CAROUSEL_CONTROL_SIZE } from '@/shared/components/Carousel'

type VideoGalleryProps = {
  title: string
  action?: string
  videos?: VideoFields[]
  loading?: boolean
}

const PLACEHOLDERS_COUNT = 12

const VideoGallery: React.FC<VideoGalleryProps> = ({ title, action, videos, loading }) => {
  const [posterSize, setPosterSize] = useState(0)
  const [galleryControlCss, setGalleryControlCss] = useState<SerializedStyles>(css``)

  useMemo(() => {
    if (!posterSize) {
      return
    }

    const topPx = posterSize / 2 - CAROUSEL_CONTROL_SIZE / 2
    setGalleryControlCss(css`
      top: ${topPx}px;
    `)
  }, [posterSize])

  const displayPlaceholders = loading || !videos

  const imgRef = useCallback((node: HTMLImageElement) => {
    if (node != null) {
      setPosterSize(node.clientHeight)
    }
  }, [])

  return (
    <Gallery
      title={title}
      action={action}
      leftControlCss={galleryControlCss}
      rightControlCss={galleryControlCss}
      disableControls={displayPlaceholders}
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
              channelAvatarURL={video.channel.avatarPhotoURL}
              views={video.views}
              createdAt={video.publishedOnJoystreamAt}
              duration={video.duration}
              posterURL={video.thumbnailURL}
              imgRef={idx === 0 ? imgRef : null}
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
