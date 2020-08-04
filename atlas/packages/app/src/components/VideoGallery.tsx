import React, { useCallback, useMemo, useState } from 'react'
import { css, SerializedStyles } from '@emotion/core'
import { navigate } from '@reach/router'

import { Gallery, VideoPreview } from '@/shared/components'
import theme from '@/shared/theme'
import { mockVideos } from '@/config/mocks'
import { shuffle } from 'lodash'

type VideoGalleryProps = {
  title: string
  action: string
}

const articleStyles = css`
  max-width: 320px;
  margin-right: 1.25rem;
`

const CAROUSEL_WHEEL_HEIGHT = theme.sizes.b12

const VideoGallery: React.FC<Partial<VideoGalleryProps>> = ({ title, action }) => {
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

  const videos = shuffle(mockVideos)

  return (
    <Gallery title={title} action={action} leftControlCss={galleryControlCss} rightControlCss={galleryControlCss}>
      {videos.map((video, idx) => (
        <article css={articleStyles} key={`${title}- ${video.title} - ${idx}`}>
          <VideoPreview
            title={video.title}
            channelName={video.channel.name}
            channelAvatarURL={video.channel.avatarURL}
            views={video.views}
            createdAt={video.createdAt}
            duration={video.duration}
            posterURL={video.posterURL}
            onClick={handleVideoClick}
            imgRef={idx === 0 ? imgRef : null}
          />
        </article>
      ))}
    </Gallery>
  )
}

export default VideoGallery
