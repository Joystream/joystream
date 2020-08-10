import React, { useCallback, useMemo, useState } from 'react'
import { css, SerializedStyles } from '@emotion/core'
import { navigate } from '@reach/router'

import { Gallery, VideoPreview } from '@/shared/components'
import theme from '@/shared/theme'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'

type VideoGalleryProps = {
  title: string
  action?: string
  videos?: VideoFields[]
  loading?: boolean
}

const articleStyles = css`
  max-width: 320px;
  margin-right: 1.25rem;
`

const CAROUSEL_WHEEL_HEIGHT = theme.sizes.b12

const VideoGallery: React.FC<VideoGalleryProps> = ({ title, action, videos, loading }) => {
  const [posterSize, setPosterSize] = useState(0)
  const [galleryControlCss, setGalleryControlCss] = useState<SerializedStyles>(css``)

  useMemo(() => {
    if (!posterSize) {
      return
    }

    const topPx = posterSize / 2 - CAROUSEL_WHEEL_HEIGHT / 2
    setGalleryControlCss(css`
      top: ${topPx}px;
    `)
  }, [posterSize])

  const imgRef = useCallback((node: HTMLImageElement) => {
    if (node != null) {
      setPosterSize(node.clientHeight)
    }
  }, [])

  const handleVideoClick = () => {
    navigate('/video/fake')
  }

  if (loading || !videos) {
    return <p>Loading</p>
  }

  return (
    <Gallery title={title} action={action} leftControlCss={galleryControlCss} rightControlCss={galleryControlCss}>
      {videos.map((video, idx) => (
        <article css={articleStyles} key={`${title}- ${video.title} - ${idx}`}>
          <VideoPreview
            title={video.title}
            channelName={video.channel.handle}
            channelAvatarURL={video.channel.avatarPhotoURL}
            views={video.views}
            createdAt={video.publishedOnJoystreamAt}
            duration={video.duration}
            posterURL={video.thumbnailURL}
            onClick={handleVideoClick}
            imgRef={idx === 0 ? imgRef : null}
          />
        </article>
      ))}
    </Gallery>
  )
}

export default VideoGallery
